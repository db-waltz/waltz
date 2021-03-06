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

import {initialiseData} from "../../../common";

import template from "./browser-detect-banner.html";
import _ from "lodash";

const bindings = {
};


const initialState = {
    bannerVisible: true
};


function controller(settingsService, $window) {

    const vm = initialiseData(this, initialState);

    const ua = $window.navigator.userAgent;
    vm.isIE = _.includes(ua, "MSIE") || _.includes(ua, "Trident/"); //checking IE 11 and below

    settingsService
        .findOrDefault("ui.banner.message","Waltz is optimised for use in modern browsers. For example Google Chrome, Firefox and Microsoft Edge")
        .then(setting => vm.bannerMessage = setting);

    vm.closeBanner = () => {
        vm.bannerVisible = false;
    };
}


controller.$inject = [
    "SettingsService",
    "$window"
];


const component = {
    bindings,
    controller,
    template
};


export default {
    component,
    id: "waltzBrowserDetectBanner"
};