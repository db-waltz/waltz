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

import _ from "lodash";

import template from "./related-measurables-table.html";
import {initialiseData} from "../../../common/index";
import {sameRef} from "../../../common/entity-utils";
import {downloadTextFile} from "../../../common/file-utils";
import {getEnumName} from "../../../common/services/enums/index";
import {relationshipKind} from "../../../common/services/enums/relationship-kind";
import {mkEntityLinkGridCell} from "../../../common/grid-utils";


const bindings = {
    rows: "<",
    onRowSelect: "<",
    selectedRow: "<"
};


const columnDefs = [
    mkEntityLinkGridCell("From", "a"),
    {
        field: "a.type",
        name: "(From Type)"
    }, {
        field: "relationships",
        name: "Relationships",
    },
    mkEntityLinkGridCell("From", "b"),
    {
        field: "b.type",
        name: "(To Type)"
    }
];

const initialState = {
    rows: [],
    columnDefs,
    onRowSelect: (row) => console.log("default on row select", { row })
};


function mkExportData(rows = []) {
    const columnNames = [[
        "From",
        "From type",
        "To",
        "To type",
        "Relationship",
        "Description",
        "Last Updated At",
        "Last Updated By"
    ]];

    const exportData = _.map(rows, r => [
        r.a.name,
        r.a.type,
        r.b.name,
        r.b.type,
        getEnumName(relationshipKind, r.relationship.relationship),
        r.relationship.description,
        r.relationship.lastUpdatedAt,
        r.relationship.lastUpdatedBy
    ]);

    return columnNames.concat(exportData);
}



function controller() {
    const vm = initialiseData(this, initialState);

    vm.isSelected = (row) => {
        if (vm.selectedRow) {
            const sameA = sameRef(row.a, vm.selectedRow.a, { skipChecks: true });
            const sameB = sameRef(row.b, vm.selectedRow.b, { skipChecks: true });
            return sameA && sameB;
        } else {
            return false;
        }
    };

    vm.$onChanges = (c) => {
        if (c.rows){
            const collectedRels = _.map(vm.rows, r => {

                const relatedKinds = _.chain(vm.rows)
                    .filter(d => d.a.id === r.a.id && d.b.id === r.b.id)
                    .map(rel => rel.relationship.relationship)
                    .value();

                const relationshipString = _.join(relatedKinds, ", ");

                return Object.assign("", {a: r.a, b: r.b, relationships: relationshipString});
            });

            vm.data = _.uniqBy(collectedRels, r => JSON.stringify([r.a, r.b, r.relationships]));
        }
    };

    vm.export = () => {
        const data = mkExportData(vm.rows);
        downloadTextFile(data, ",", "related_viewpoints.csv");
    };
}


const component = {
    template,
    controller,
    bindings
};


export default {
    component,
    id: "waltzRelatedMeasurablesTable"
};