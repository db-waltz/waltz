/*
 * Waltz - Enterprise Architecture
 * Copyright (C) 2016, 2017, 2018, 2019 Waltz open source project
 * See README.md for more information
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific
 *
 */

package com.khartec.waltz.data.application.search;

import com.khartec.waltz.data.DBExecutorPoolInterface;
import com.khartec.waltz.data.FullTextSearch;
import com.khartec.waltz.data.SearchDao;
import com.khartec.waltz.data.UnsupportedSearcher;
import com.khartec.waltz.data.application.ApplicationDao;
import com.khartec.waltz.model.EntityKind;
import com.khartec.waltz.model.NameProvider;
import com.khartec.waltz.model.application.Application;
import com.khartec.waltz.model.entity_search.EntitySearchOptions;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.lambda.Unchecked;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Future;
import java.util.function.Supplier;

import static com.khartec.waltz.common.Checks.checkNotNull;
import static com.khartec.waltz.common.CollectionUtilities.sort;
import static com.khartec.waltz.common.SetUtilities.orderedUnion;
import static com.khartec.waltz.data.JooqUtilities.*;
import static com.khartec.waltz.data.SearchUtilities.mkRelevancyComparator;
import static com.khartec.waltz.data.SearchUtilities.mkTerms;
import static com.khartec.waltz.schema.tables.Application.APPLICATION;
import static com.khartec.waltz.schema.tables.EntityAlias.ENTITY_ALIAS;
import static java.util.Collections.emptyList;

@Repository
public class ApplicationSearchDao implements SearchDao<Application> {


    private final DSLContext dsl;
    private final FullTextSearch<Application> searcher;
    private final DBExecutorPoolInterface dbExecutorPool;


    @Autowired
    public ApplicationSearchDao(DSLContext dsl, DBExecutorPoolInterface dbExecutorPool) {
        this.dsl = dsl;
        this.dbExecutorPool = dbExecutorPool;
        this.searcher = determineSearcher(dsl.dialect());
    }


    @Override
    public List<Application> search(EntitySearchOptions options) {
        checkNotNull(options, "options cannot be null");

        List<String> terms = mkTerms(options.searchQuery());

        if (terms.isEmpty()) {
            return emptyList();
        }

        Condition lifecycleCondition = APPLICATION.ENTITY_LIFECYCLE_STATUS.in(options.entityLifecycleStatuses());
        Condition nameCondition = mkBasicTermSearch(APPLICATION.NAME, terms);
        Condition assetCodeCondition = mkStartsWithTermSearch(APPLICATION.ASSET_CODE, terms);
        Condition aliasCondition = ENTITY_ALIAS.KIND.eq(EntityKind.APPLICATION.name())
                .and(mkBasicTermSearch(ENTITY_ALIAS.ALIAS, terms));

        Future<List<Application>> appsViaAssetCode = dbExecutorPool.submit(() -> dsl
                .select(APPLICATION.fields())
                .from(APPLICATION)
                .where(assetCodeCondition)
                .and(lifecycleCondition)
                .orderBy(APPLICATION.NAME)
                .limit(options.limit())
                .fetch(ApplicationDao.TO_DOMAIN_MAPPER));

        Future<List<Application>> appsViaAlias = dbExecutorPool.submit(() -> dsl
                .selectDistinct(APPLICATION.fields())
                .from(APPLICATION)
                .innerJoin(ENTITY_ALIAS)
                .on(ENTITY_ALIAS.ID.eq(APPLICATION.ID))
                .where(aliasCondition)
                .and(lifecycleCondition)
                .orderBy(APPLICATION.NAME)
                .limit(options.limit())
                .fetch(ApplicationDao.TO_DOMAIN_MAPPER));

        Future<List<Application>> appsViaName = dbExecutorPool.submit(() -> sort(
                dsl
                    .select(APPLICATION.fields())
                    .from(APPLICATION)
                    .where(nameCondition)
                    .and(lifecycleCondition)
                    .orderBy(APPLICATION.NAME)
                    .limit(options.limit())
                    .fetch(ApplicationDao.TO_DOMAIN_MAPPER),
                mkRelevancyComparator(NameProvider::name, terms.get(0))));

        Future<List<Application>> appsViaFullText = dbExecutorPool.submit(() -> searcher.searchFullText(dsl, options));

        Supplier<Set<Application>> result = Unchecked.supplier(() -> orderedUnion(
                appsViaAssetCode.get(),
                appsViaName.get(),
                appsViaAlias.get(),
                appsViaFullText.get()));

        return new ArrayList<>(result.get());
    }


    private FullTextSearch<Application> determineSearcher(SQLDialect dialect) {

        if (isPostgres(dialect)) {
            return new PostgresAppSearch();
        }

        if (isMariaDB(dialect)) {
            return new MariaAppSearch();
        }

        if (isSQLServer(dialect)) {
            return new SqlServerAppSearch();
        }

        return new UnsupportedSearcher<>(dialect);
    }
}
