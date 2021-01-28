import "../sass/style.scss";

import { $, $$ } from "./modules/bling";
import autocomplete from "./modules/autocomplete";
import previewFile from "./modules/previewFile";
import typeAhead from "./modules/typeAhead";
import makeMap from "./modules/map";
import ajaxHeart from "./modules/heart";
typeAhead($(".search"));
autocomplete($("#address"), $("#lat"), $("#lng"));
previewFile($("#photo"), $("#storePhoto"));
makeMap($("#map"));
const heartForms = $$("form.heart");
heartForms.on("submit", ajaxHeart);
