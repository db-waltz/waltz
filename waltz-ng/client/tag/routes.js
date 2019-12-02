/*
 * Waltz - Enterprise Architecture
 * Copyright (C) 2016, 2017 Waltz open source project
 * See README.md for more information
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import tagApplicationView from "./pages/tag-application-view";
import tagPhysicalFlowView from "./pages/tag-physical-flow-view";
import {CORE_API} from "../common/services/core-api-utils";


const base = {
    url: "tags"
};

const idState = {
    url: "/id/{id:int}"
};

const bouncerState = {
    url: "/overview",
    resolve: {
        bouncer
    }
};

const appViewState = {
    url: "/application",
    views: {"content@": tagApplicationView }
};

const physicalFlowViewState = {
    url: "/physical_flow",
    views: {"content@": tagPhysicalFlowView }
};


function setup($stateProvider) {
    $stateProvider
        .state("main.tag", base)
        .state("main.tag.id", idState)
        .state("main.tag.id.view", bouncerState)
        .state("main.tag.id.application", appViewState)
        .state("main.tag.id.physical_flow", physicalFlowViewState);
}

function bouncer($state, $stateParams, serviceBroker) {
    const id = $stateParams.id;

    serviceBroker
        .loadViewData(
            CORE_API.TagStore.getTagById,
            [ id ])
        .then(r => {
            const tag = r.data;
            $state.go(`main.tag.id.${tag.targetKind.toLowerCase()}`, {id: id}, { location: false });
        });
}

setup.$inject = [
    "$stateProvider"
];

bouncer.$inject = [
    "$state",
    "$stateParams",
    "ServiceBroker"
];


export default setup;