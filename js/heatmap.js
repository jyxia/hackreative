/**
* Team: Hackreative
* A heatmap for several types of data based on location
*/

var Store = function(id, latitude, longitude, sales) {
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.sales = sales;
};

// convert a location to Google location
var locationDataToGMapData = function (latitude, longitude, sales) {
    return { location: new google.maps.LatLng(latitude, longitude), weight: sales };
};

// Map object for the entire map
var generateMap = function () {
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(35.116753, -80.82477),
        // mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    return new google.maps.Map(document.getElementById('map-canvas'),
          mapOptions);
};

// Map object for the entire map
var DataMap = function () {
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(35.116753, -80.82477),
        // mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    this.map = new google.maps.Map(document.getElementById('map-canvas'),
          mapOptions);
    // this.pointArray, this.heatmap;
    this.pointArray = new google.maps.MVCArray();
    this.heatmap = new google.maps.visualization.HeatmapLayer({
        data: this.pointArray
    });

};

// Heatmap object
var Heatmap = function(data) {
    this.pointArray = new google.maps.MVCArray(data);
    this.heatmap = new google.maps.visualization.HeatmapLayer({
        data: this.pointArray
    });
};

// not used
var setmap = function(map, data) {
    // var heatmapObj = new Heatmap(data);
    // var heatmap = heatmapObj.heatmap;
    // var pointArray = new google.maps.MVCArray();
    map.pointArray = [];
    map.heatmap.setMap(null);
    map.pointArray = new google.maps.MVCArray(data);
    map.heatmap = new google.maps.visualization.HeatmapLayer({
        data: map.pointArray
    });
    map.heatmap.set('radius', map.heatmap.get('radius') ? null : 25);
    map.heatmap.setMap(map.map);
};

// keep the map, just reloat the data
var refreshData = function(map, stores) {
    var storeLocations = [];
    for (var i = 0; i < stores.length; i++) {
        var gmapslocaiton = locationDataToGMapData(stores[i].latitude, stores[i].longitude, stores[i].sales);
        // console.log(gmapslocaiton);
        storeLocations.push(gmapslocaiton);
    }
    setmap(map, storeLocations);
};

// after parsing the json data, initialize google map
var finishparsing = function(map, stores) {
    var storeLocations = [];
    for (var i = 0; i < stores.length; i++) {
        var gmapslocaiton = locationDataToGMapData(stores[i].latitude, stores[i].longitude, stores[i].sales);
        storeLocations.push(gmapslocaiton);
    }
    // console.log(storeLocations);
    google.maps.event.addDomListener(window, 'load', function() {
        setmap(map, storeLocations);
    });
};    

// time slider
var setSlider = function (map, filter) {
    $( "#timeslider").slider({
      orientation: "horizontal",
      range: "min",
      min: 0,
      max: 5,
      value: 0,
      step: 1,
      slide: function( event, ui ) {
        var url;           
        // console.log(ui.value);
        var slideValue = ui.value;
        switch (ui.value) {
            case 0:
                url = "./data/data_stores/data_stores_09_n";
                break;
            case 1:
                url = "./data/data_stores/data_stores_10_n";
                break;
            case 2:
                url = "./data/data_stores/data_stores_11_n";
                break;
            case 3:
                url = "./data/data_stores/data_stores_12_n";
                break;
            case 4:
                url = "./data/data_stores/data_stores_01_n";
                break;
            case 5:
                url = "./data/data_stores/data_stores_02_n";
                break;
            default:
        }
        storesJSONToMap(map, url, filter, refreshData);
      }
    });
};

// convert JSON to GMap location objects and render them on the map
var storesJSONToMap = function (map, url, filter, finishparsing) {
    $.getJSON(url, function(json) {
        var stores = [];
        for (var i = 0; i < json.data.length; i++) {
            var data = json.data[i];
            var id = data.store;
            var latitude = data.storelat;
            var longitude = data.storelon;
            // var sales = (data.sum_sales + 0.1) / (data.visit + 0.1);
            // var sales = data.sum_sales / data.visit;
            // var weight = data.sum_sales;
            var weight = determineWeight(data, filter);
            var store = new Store(id, latitude, longitude, weight);
            // console.log(store);
            stores.push(store);
        }
        finishparsing(map, stores);
    });
};

// given a filter type, determine data weight
var determineWeight = function(data, filter) {
    var weight; 
    switch (filter) {
        case "sum_sales":
            weight = data.sum_sales;
            break;
        case "visit":
            weight = data.visit;
            break;
        case "sum_quantity":
            weight = data.sum_quantity;
            break;
        case "salesvisit":
            if (data.visit == 0) {
                weight = 0;
            } else {
                weight = data.sum_sales / data.visit;
            }
            break;
        case "salesquantity":
            if (data.sum_quantity == 0)  {
                weight = 0;
            } else {
                weight = data.sum_sales / data.sum_quantity;
            }
            break;
        default:
            weight = data.sum_sales;
    }

    return weight;
};

var changeGradient = function() {
  var gradient = [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 223, 1)',
    'rgba(0, 0, 191, 1)',
    'rgba(0, 0, 159, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)'
  ]
  heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
};

$( document ).ready(function() {
    $.ajaxSetup({
        cache: false
    });
    var $sales_btn = $("#sales_btn");
    var $visits_btn = $("#visits_btn");
    var $quantity_btn = $("#quantity_btn");
    var $salesvisit_btn = $("#salesvisit_btn");
    var $salequantity_btn = $("#salequantity_btn");
    var $radioButtons = $("#radio");
    $radioButtons.buttonset();

    var initJSONurl = "./data/data09.json";
    // var map = generateMap();
    var datamap = new DataMap();
    var filter = "sum_sales";
    storesJSONToMap(datamap, initJSONurl, filter, finishparsing);
    setSlider(datamap, filter);

    $sales_btn.on("click", function() {
        filter = "sum_sales";
        storesJSONToMap(datamap, initJSONurl, filter, refreshData);
        setSlider(datamap, filter);
    });
    $visits_btn.on("click", function() {
        filter = "visit";
        storesJSONToMap(datamap, initJSONurl, filter, refreshData);
        setSlider(datamap, filter);
    });
    $quantity_btn.on("click", function() {
        filter = "sum_quantity";
        storesJSONToMap(datamap, initJSONurl, filter, refreshData);
        setSlider(datamap, filter);
    });
    $salesvisit_btn.on("click", function() {
        filter = "salesvisit";
        storesJSONToMap(datamap, initJSONurl, filter, refreshData);
        setSlider(datamap, filter);
    });
    $salequantity_btn.on("click", function() {
        filter = "salesquantity";
        storesJSONToMap(datamap, initJSONurl, filter, refreshData);
        setSlider(datamap, filter);
    });
});
