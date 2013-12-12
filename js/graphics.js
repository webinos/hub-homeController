var lineColor=['blue','red','orange','green','violet','brown','pink','yellow'];

Function.prototype.subclassFrom=function(superClassFunc) {
    if (superClassFunc == null) {
        this.prototype={};
    } 
    else {
        this.prototype = new superClassFunc();
        this.prototype.constructor=this;
        this.superConstructor=superClassFunc;   
  }
}

Function.prototype.methods=function(funcs) {
    for (each in funcs) 
        if (funcs.hasOwnProperty(each)) {
            var original=this.prototype[each];
            funcs[each].superFunction=original;
            this.prototype[each]=funcs[each];
        }
}

function Graphic(target, idChart, X, Y, min, max) {
    this.id = idChart;
    this.target = target;
    this.service_list=[];
    this.serviceAddress_list=[];
    this.values=[];
    this.old_values=[];
    this.graphData =[];
    this.numberOfValues=0;
    this.title='';
    this.type='';
    this.options='';
    this.sensor_active={};
    
    if(min)
        this.minRange = min;
    else
        this.minRange = 0;
    
    if(max)
        this.maxRange = max;
    else
        this.maxRange = 100;

    this.coord = {
        x:X,
        y:Y
    }
    this.allowed_drop = [];
}

Graphic.methods({
    setVal : function(val) {},
    getHTMLContent : function(){
        var idChart = this.id;
        var html = "";
        html += "<div id='main-"+idChart+"' class='window'>";   //this div is used for deleting all the elements of this chart when delete button is clicked
        html += "<div id='info-"+idChart+"' class='chart-titlebar'><div id='name-"+idChart+"' class='chart-sensorname gauge' />";
        html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' class='chart-control delete' />";
        html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' class='chart-control settings' />";
        html += "</div>";
        return html;
    },
    canDrop : function(service){
        var allowed = false;
        for(var i in this.allowed_drop){
            if(service.indexOf(this.allowed_drop[i]) != -1){
                allowed = true;
                break;
            }
        }
        return allowed;
    },
    getCustomSettingsForSensor : function(sensor){
    },
    getSettingPage : function(){
            var html='';
            for(var sensor in this.service_list){
            if(sensors[this.service_list[sensor]].api.indexOf(sensors_type) != -1){
                // Configuration for sensor service
                html+= "<div id='configuration_div-"+this.id+"-"+this.service_list[sensor]+"' class='configuration_div'>";
                html+= "<div id='remove_sensor-"+this.id+"-"+this.service_list[sensor]+"' class='remove_sensor' >X</div> ";
                html+= "<div id='sensor_name_config-"+this.service_list[sensor]+"'>Sensor name: "+sensors[this.service_list[sensor]].description+"</div>";
                html+= "<div id='sensor_id_config-"+this.service_list[sensor]+"'> Sensor id: "+this.service_list[sensor]+"</div>";
                html+= "<div id='mode' class='param_td'>Mode";
                html+= "<select id='cfg_mode-"+this.service_list[sensor]+"'>";

                if(sensors_configuration[this.service_list[sensor]].eventFireMode=='fixedinterval'){
                    html+= "<option selected value='fixedinterval'>Fixed Interval</option>";
                    html+= "<option value='valuechange'>Value Change</option>";
                }
                else{
                    html+= "<option value='fixedinterval'>Fixed Interval</option>";
                    html+= "<option selected value='valuechange'>Value Change</option>";
                }
                html+= "</select>";
                if(this.sensor_active[this.service_list[sensor]]==true){
                    html+="<input type='button' id='startstop_cfg_but-"+this.id+"-"+this.service_list[sensor]+"' value='Stop'>";
                }else{
                    html+="<input type='button' id='startstop_cfg_but-"+this.id+"-"+this.service_list[sensor]+"' value='Start'>";
                }
                html+= "</div>";
                html+= "<div id='rate' > Rate <input type='text' id='cfg_rate-"+this.service_list[sensor]+"' class='cfg_element' value='"+sensors_configuration[this.service_list[sensor]].rate+"' ></div>";
                html+= "<div id='timeout'> Timeout <input type='text' id='cfg_timeout-"+this.service_list[sensor]+"' class='cfg_element' value='"+sensors_configuration[this.service_list[sensor]].timeout+"'></div>";                    
                html += this.getCustomSettingsForSensor(sensor);
                html+= "</div>";
            }
            else if(sensors[this.service_list[sensor]].api.indexOf(geolocation_type) != -1){
                //TODO Configuration for geolocation service
                var html = "";
                alert(this.type);
                if(this.type == 'text-label'){
                    html += "Configuration for Text Label";
                }
                else if(this.type == 'google-map'){
                    html += "Configuration for Google Map";
                }
            }
        }
        return html;
    },
    toObject: function(){
        var tmp = {};
        tmp["type"] = this.type;
        tmp["service_list"] = [];
        for(var i in this.service_list){
            var tmp2 = {};
            tmp2["id"] = sensors[this.service_list[i]].id;
            tmp2["api"] = sensors[this.service_list[i]].api;
            tmp2["serviceAddress"] = sensors[this.service_list[i]].serviceAddress;
            tmp["service_list"].push(tmp2);
        }
        tmp["minRange"] = this.minRange;
        tmp["maxRange"] = this.maxRange;
        var lc = $("#leftcolumn").css("width").replace("px","");
        lc = Number(lc);
        tmp["coord"] = {
            x: $("#main-"+this.id).position().left - lc,
            y: $("#main-"+this.id).position().top
        }
        return tmp;
    }
});


function Thermometer(target, idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y, min, max);
    
    this.type="thermometer";
        // this.minRange=min_temperature_range;
        // this.maxRange=max_temperature_range;
    
    this.allowed_drop = [sensors_type];
    this.old_value = -1;

    this.target.prepend(this.getHTMLContent());
    this.chart = new RGraph.Thermometer("drop_canvas-"+this.id, this.minRange, this.maxRange, 0);
    RGraph.Effects.Thermometer.Grow(this.chart);
}

Thermometer.subclassFrom(Graphic);

Thermometer.methods({
    setVal : function(val) {
        val = Number(val);
        if(this.old_value != val){
            this.chart.value = val;
            RGraph.Effects.Thermometer.Grow(this.chart);
            this.old_value = val;
        }
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<canvas class='main' id='drop_canvas-"+this.id+"' width='100' height='400'></canvas></div>";
        return html;
    },
    getCustomSettingsForSensor : function(sensor){
        return "<div id='range'> Range:     Min <input type='text' id='min_range-"+this.service_list[sensor]+"' value='"+this.minRange+"'>        Max <input type='text' id='max_range-"+this.service_list[sensor]+"' value='"+this.maxRange+"'></div>";
    }
});


function Gauge(target, idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y, min, max);
    this.type="gauge";
    // this.minRange=min_gauge_range;
    // this.maxRange=max_gauge_range;

    this.allowed_drop = [sensors_type];
    this.old_value = -1;

    //$("#target").prepend(this.getHTMLContent());
    this.target.prepend(this.getHTMLContent());
    this.chart = new RGraph.Gauge("drop_canvas-"+this.id, this.minRange, this.maxRange, 0);
    RGraph.Effects.Gauge.Grow(this.chart);
}

Gauge.subclassFrom(Graphic);

Gauge.methods({
    setVal : function(val) {
        val = Number(val);
        if(this.old_value != val){
            this.chart.value = val;
            RGraph.Effects.Gauge.Grow(this.chart);
            this.old_value = val;
        }
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<canvas class='main' id='drop_canvas-"+this.id+"' width='250' height='250'></canvas></div>";         
        return html;
    },
    getCustomSettingsForSensor : function(sensor){
        return "<div id='range'> Range:     Min <input type='text' id='min_range-"+this.service_list[sensor]+"' value='"+this.minRange+"'>        Max <input type='text' id='max_range-"+this.service_list[sensor]+"' value='"+this.maxRange+"'></div>";
    }
});


function TextLabel(target, idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y, min, max);

    this.type="text-label";
    this.allowed_drop = [sensors_type, geolocation_type, deviceOrientation_type];

    this.target.prepend(this.getHTMLContent());
    this.chart = document.getElementById("drop_canvas-"+this.id);
    this.setVal("-");
    
}

TextLabel.subclassFrom(Graphic);

TextLabel.methods({
    setVal : function(val) {
        this.chart.innerHTML = val;
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<div class='text-label' id='drop_canvas-"+this.id+"'></div></div>";
        return html;
    },
    getCustomSettingsForSensor : function(sensor){
        return "";
    }
});


function DroneJoystick(target, idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y, min, max);

    this.type="drone-joystick";
    this.allowed_drop = [actuators_type];

    this.target.prepend(this.getHTMLContent());
    this.chart = document.getElementById("drop_canvas-"+this.id);
    //this.setVal("-");
    

    $(document).on("click", "#takeoff-"+this.id, function(event){
        var id = event.target.id.split("-")[1];
        try{
            var graphic = charts_presentation[id];
            graphic.setVal(0);
        }
        catch(e){
            console.log("Cannot set value in build mode");
        }
    });

    $(document).on("click", "#landing-"+this.id, function(event){
        var id = event.target.id.split("-")[1];
        try{
            var graphic = charts_presentation[id];
            graphic.setVal(1);
        }
        catch(e){
            console.log("Cannot set value in build mode");
        }
    });

    $(document).on("click", "#movefront-"+this.id, function(event){
        var id = event.target.id.split("-")[1];
        try{
            var graphic = charts_presentation[id];
            graphic.setVal(5);
        }
        catch(e){
            console.log("Cannot set value in build mode");
        }
    });

    $(document).on("click", "#moveback-"+this.id, function(event){
        var id = event.target.id.split("-")[1];
        try{
            var graphic = charts_presentation[id];
            graphic.setVal(6);
        }
        catch(e){
            console.log("Cannot set value in build mode");
        }
    });

    $(document).on("click", "#moveleft-"+this.id, function(event){
        var id = event.target.id.split("-")[1];
        try{
            var graphic = charts_presentation[id];
            graphic.setVal(7);
        }
        catch(e){
            console.log("Cannot set value in build mode");
        }
    });

    $(document).on("click", "#moveright-"+this.id, function(event){
        var id = event.target.id.split("-")[1];
        try{
            var graphic = charts_presentation[id];
            graphic.setVal(8);
        }
        catch(e){
            console.log("Cannot set value in build mode");
        }
    });

    $(document).on("click", "#rotateclock-"+this.id, function(event){
        var id = event.target.id.split("-")[1];
        try{
            var graphic = charts_presentation[id];
            graphic.setVal(9);
        }
        catch(e){
            console.log("Cannot set value in build mode");
        }
    });

    $(document).on("click", "#rotatecounter-"+this.id, function(event){
        var id = event.target.id.split("-")[1];
        try{
            var graphic = charts_presentation[id];
            graphic.setVal(10);
        }
        catch(e){
            console.log("Cannot set value in build mode");
        }
    });
}

DroneJoystick.subclassFrom(Graphic);

DroneJoystick.methods({
    setVal : function(val) {
        if(this.service_list.length>0){
            var service_id = getId(this.service_list[0]);
            var service = sensors[service_id];
            
            service.setValue([val],
                function(actuatorEvent){},
                function(actuatorError){}
            );
        }
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        
        // html += "<div class='drone-joystick' id='drop_canvas-"+this.id+"'>";
        // html += "<div><input id='takeoff-"+this.id +"' type='button' value='Take Off'/> <input id='landing-"+this.id +"' type='button' value='Landing'/></div>";
        // html += "<div style='margin-top:20px;'><input id='movefront-"+this.id +"' type='button' value='Move Front'/></div>";
        // html += "<div><input id='moveleft-"+this.id +"' type='button' value='Move Left'/> <input id='moveright-"+this.id +"' type='button' value='Move Right'/></div>";        
        // html += "<div style='margin-bottom:20px;'><input id='moveback-"+this.id +"' type='button' value='Move Back'/></div>";
        // html += "<div><input id='rotateclock-"+this.id +"' type='button' value='Rotate Clockwise'/> <input id='rotatecounter-"+this.id +"' type='button' value='Rotate counterClockWise'/></div>";
        // html += "</div></div>";

        html += "<div class='drone-joystick' id='drop_canvas-"+this.id+"'>";
        html += "<div><span style='margin-right:20px'><input type='image' id='takeoff-"+this.id +"' width='70px' height='70px' src='assets/images/takeoff.png'/></span> <span style='margin-left:20px'><input type='image' id='landing-"+this.id +"' width='70px' height='70px' src='assets/images/landing.png'/></span></div>";
        html += "<div style='margin-top:20px;'><input type='image' id='movefront-"+this.id+"' width='50px' height='50px' src='assets/images/front.png'></div>";
        html += "<div><span style='margin-right:15px'><input type='image' id='moveleft-"+this.id +"' width='50px' height='50px' src='assets/images/left.png'/></span><span style='margin-left:15px'> <input type='image' id='moveright-"+this.id +"' width='50px' height='50px' src='assets/images/right.png'/></span></div>";        
        html += "<div style='margin-bottom:20px;'><input type='image' id='moveback-"+this.id +"' width='50px' height='50px' src='assets/images/back.png'/></div>";
        html += "<div><span style='margin-right:20px'><input type='image' id='rotateclock-"+this.id +"' width='70px' height='70px' src='assets/images/clock.png'/></span> <span style='margin-left:20px'><input type='image' id='rotatecounter-"+this.id +"' width='70px' height='70px' src='assets/images/counter.png'/></span></div>";
        html += "</div></div>";
        return html;


        
    },
    getCustomSettingsForSensor : function(sensor){
        return "";
    }
});


function LineChart(target, idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y, min, max);
    this.type="line-chart";
    this.allowed_drop = [sensors_type, geolocation_type, deviceOrientation_type];
    //this.allowed_drop = [sensors_type, deviceOrientation_type];
    this.graphic_values = [];

    try{
        this.graphData=new google.visualization.DataTable();
        this.graphData.addColumn('string','Data');
        this.graphData.addColumn('number',null);
        this.options = {
            title: '',
            chartArea: {width: '90%', height: '75%', top:'25', left: '50'},
            legend: {position: 'top'},
            titlePosition: 'in', axisTitlesPosition: 'in',
            hAxis: {textPosition: 'out'}, vAxis: {textPosition: 'out'},     
            colors:['blue','red','orange','green','violet','brown','pink','yellow'],
            pointSize: 0
        };

        this.target.prepend(this.getHTMLContent());
        var chart_div = document.getElementById('chart_div-'+idChart);
        this.chart = new google.visualization.LineChart(chart_div);
        this.chart.draw(this.graphData, this.options);
    }
    catch(e){
        throw {message: "Failed to load google chart. Please check your Internet connection."};
    }
}

LineChart.subclassFrom(Graphic);

LineChart.methods({
    setOrientationVal : function(val) { //val is an array e.g. ['2004', 1000, 400]
        if(Array.isArray(val)){ 
            if(this.graphic_values.length==0){
                this.graphic_values.push(['Time', 'Alpha', 'Beta', 'Gamma']);
            }
            this.graphic_values.push(val);
            if(this.graphic_values.length > 20){
                this.graphic_values.splice(1,1);
            }
            this.chart.draw(google.visualization.arrayToDataTable(this.graphic_values),this.options);
        }
    },
    setGeolocationVal : function(val) { //val is an array e.g. ['2004', 1000, 400]
        if(Array.isArray(val)){ 
            if(this.graphic_values.length==0){
                this.graphic_values.push(['Time', 'Latitude', 'Longitude']);
            }
            this.graphic_values.push(val);
            if(this.graphic_values.length > 20){
                this.graphic_values.splice(1,1);
            }
            this.chart.draw(google.visualization.arrayToDataTable(this.graphic_values),this.options);
        }
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<div class='' id='drop_canvas-"+this.id+"'></div>";
        html += "<div id='chart_div-"+this.id+"' class='line-chart'></div>";
        return html;
    },
    getCustomSettingsForSensor : function(sensor){
        var html = "";
        html+= "<div id='color' class='param_td'>Color";
        html+= "<select id='cfg_color-"+this.service_list[sensor]+"'>";
        for(var i=0;i<this.options.colors.length;i++){
            if(lineColor[i]==this.options.colors[sensor]){
                html+= "<option selected value='"+lineColor[i]+"'>"+lineColor[i]+"</option>";
            }
            else{
                html+= "<option value='"+lineColor[i]+"'>"+lineColor[i]+"</option>";
            }
        }
        html+= "</select>"; 
        return html;
    }
});

// TO REMOVE ------------------------------------------
// var data = [
//       ["20131001",10,100],
//       ["20131002",20,80],
//       ["20131003",50,60],
//       ["20131004",70,80]
//     ];

  function getData(data){
    //var result = "Date,NY,SF\n";
    var result = "Date,NY\n";

    for(var i=0; i<data.length; i++)
      //result += data[i][0] + "," + (data[i][1]-5) + ";" + data[i][1] + ";" + (data[i][1]+5) + "," + (data[i][2]-5) + ";" + data[i][2] + ";" + (data[i][2]+5) + "\n";
  result += data[i][0] + "," + (data[i][1]-5) + ";" + data[i][1] + ";" + (data[i][1]+5) + "\n";
  //result += data[i][0] + "," + data[i][1] + "\n";
    return result;
  }
//---------------------------------------------------

function HistoricalChart(target, idChart, X, Y){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y);
    this.type="historical-chart";
    
    // this.graphData=new google.visualization.DataTable();
    // this.graphData.addColumn('string','Data');
    // this.graphData.addColumn('number',null);
    // this.options = {
    //     title: '',
    //     chartArea: {width: '90%', height: '75%', top:'25', left: '50'},
    //     legend: {position: 'top'},
    //     titlePosition: 'in', axisTitlesPosition: 'in',
    //     hAxis: {textPosition: 'out'}, vAxis: {textPosition: 'out'},     
    //     colors:['blue','red','orange','green','violet','brown','pink','yellow'],
    //     pointSize: 0
    // };

    this.allowed_drop = [sensors_type];

    this.target.prepend(this.getHTMLContent());
    
    this.chart_div = document.getElementById('chart_div-'+idChart);

    this.chart = null;
    this.seriesOptions = [];
    this.seriesCounter = 0;

    this.chartDivId = 'chart_div-'+idChart;
    this.historicalLoaded = false;

    Highcharts.setOptions({
        global : {
            useUTC : false
        }
    });


}

HistoricalChart.subclassFrom(Graphic);

HistoricalChart.methods({
    setLabel : function (description){
        var $list = $(this.chart_div).children("#serviceList");
        if ($list.length == 0){
            $list = $(this.chart_div).append("<ul id='serviceList'></ul>").children("#serviceList");
        }
        $list.append("<li>"+description+"</li>");
    },
    setVal : function(id, service, data, isHistorical) {
        if (isHistorical) {
//            if (this.chart == null) {
//                this.renderChart(id, service, data);
//            } else {
//                var series = this.chart.get(id);
//                if (series) {
//                    $.each(data, function(i,dat){
//                        series.addPoint(dat, false);
//                    });
//                    this.chart.redraw();
//                } else {
//                    this.chart.addSeries(
//                        {
//                            id: id,
//                            name: sensors[id].description+" @ "+service.serviceAddress,
//                            data: data
//                        }
//                    );
//                }
//            }
//            this.historicalLoaded = true;
            this.seriesOptions[this.seriesCounter++] = {
                id: id,
                name: sensors[id].description+" @ "+service.serviceAddress,
                data: data
            };
            if (this.seriesCounter == this.service_list.length) {
                this.renderChart();
                this.historicalLoaded = true;
            }
        } else if (this.historicalLoaded) {
            if (this.chart == null) {
                this.renderChart(id, service, data);
            } else {
                var series = this.chart.get(id);
                if (series) {
                    series.addPoint(data, true);
                } else {
                    this.chart.addSeries(
                        {
                            id: id,
                            name: sensors[id].description+" @ "+service.serviceAddress,
                            data: data
                        }
                    );
                }
            }
        }
    },
    renderChart : function(id, service, data){
        // Create the chart
        this.chart = new Highcharts.StockChart({
            chart : {
                renderTo: this.chartDivId,
                events : {
                    load : function() {
                        // setInterval(function() {
                        //     if (self.chartDataChanged){
                        //         self.chart.redraw();
                        //         self.chartDataChanged = false;
                        //     }
                        // }, 1000);
                    }
                }
            },

            rangeSelector: {
                buttons: [{
                    count: 1,
                    type: 'minute',
                    text: '1M'
                }, {
                    count: 5,
                    type: 'minute',
                    text: '5M'
                }, {
                    count: 1440,
                    type: 'minute',
                    text: '1D'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                inputEnabled: false,
                selected: 3
            },

            title : {
//            text : 'Live random data'
            },

            exporting: {
                enabled: false
            },

//            series : [{
//                id: id,
//                name: sensors[id].description+" @ "+service.serviceAddress,
//                data: data
//            }]
            series:this.seriesOptions
        });
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<div class='' id='drop_canvas-"+this.id+"'>";
        html += "<div id='chart_div-"+this.id+"' class='line-chart'></div></div></div>";
        return html;

        // html += "<div class='text-label' id='drop_canvas-"+this.id+"'></div></div>";
        // return html;
    },
    getCustomSettingsForSensor : function(sensor){
        // var html = "";
        // html+= "<div id='color' class='param_td'>Color";
        // html+= "<select id='cfg_color-"+this.service_list[sensor]+"'>";
        // for(var i=0;i<this.options.colors.length;i++){
        //     if(lineColor[i]==this.options.colors[sensor]){
        //         html+= "<option selected value='"+lineColor[i]+"'>"+lineColor[i]+"</option>";
        //     }
        //     else{
        //         html+= "<option value='"+lineColor[i]+"'>"+lineColor[i]+"</option>";
        //     }
        // }
        // html+= "</select>"; 
        // return html;
    }
});


function GoogleMap(target, idChart, X, Y){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y);

    this.type="google-map";
    this.marker;
    this.latitude = 0;
    this.longitude = 0;

    this.allowed_drop = [geolocation_type];

    
    //var latlng = new google.maps.LatLng(this.latitude,this.longitude);
    var latlng
    try{
        var latlng = new google.maps.LatLng(42.745334,12.738430);
        this.target.prepend(this.getHTMLContent());
        var options = { zoom: 12,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
            //,draggable : false
        };

        //this.chart = new google.maps.Map(document.getElementById("drop_canvas-"+this.id), options);

        var chart_div = document.getElementById('chart_div-'+idChart);
        this.chart = new google.maps.Map(document.getElementById("chart_div-"+this.id), options);
    }
    catch(e){
        throw {message: "Failed to load google map. Please check your Internet connection."};
    }
}

GoogleMap.subclassFrom(Graphic);

GoogleMap.methods({
    addMarker : function(lat, lon) {
        var latlng = new google.maps.LatLng(lat,lon);
        if(!this.marker){
            this.marker = new google.maps.Marker({ position: latlng,
                map: this.chart, 
                title: 'Example title' });
        }
        else
            this.marker.setPosition(latlng);
    },
    setCenter : function(lat, lon){
        this.chart.set('center', new google.maps.LatLng(lat, lon));
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        //html += "<div id='drop_canvas-"+this.id+"' class='google-map'></div></div>";
        html += "<div id='drop_canvas-"+this.id+"' class=''></div>";
        html += "<div id='chart_div-"+this.id+"' class='google-map'></div></div>";
        return html;
    }
});

function CornerGauge(target, idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y, min, max);
    this.type="corner-gauge";
    // this.minRange=min_gauge_range;
    // this.maxRange=max_gauge_range;

    this.allowed_drop = [sensors_type];
    
    this.old_value = -1;
    
    this.target.prepend(this.getHTMLContent());
    this.chart = new RGraph.CornerGauge("drop_canvas-"+this.id, this.minRange, this.maxRange, 0);
    RGraph.Effects.CornerGauge.Grow(this.chart);
}

CornerGauge.subclassFrom(Graphic);

CornerGauge.methods({
    setVal : function(val) {
        val = Number(val);
        if(this.old_value != val){
            this.chart.value = val;
            RGraph.Effects.CornerGauge.Grow(this.chart);
            this.old_value = val;
        }
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<canvas class='main' id='drop_canvas-"+this.id+"' width='250' height='250'></canvas></div>";         
        return html;
    },
    getCustomSettingsForSensor : function(sensor){
        return "<div id='range'> Range:     Min <input type='text' id='min_range-"+this.service_list[sensor]+"' value='"+this.minRange+"'>        Max <input type='text' id='max_range-"+this.service_list[sensor]+"' value='"+this.maxRange+"'></div>";
    }
});

function FuelGauge(target, idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y, min, max);
    this.type="fuel-gauge";
    // this.minRange= (min)?min:0; //min_gauge_range;
    // this.maxRange= (max)?max:100; //max_gauge_range;

    this.allowed_drop = [sensors_type];
    this.old_value = -1;

    this.target.prepend(this.getHTMLContent());
    this.chart = new RGraph.Fuel("drop_canvas-"+this.id, this.minRange, this.maxRange, 0);
    RGraph.Effects.Fuel.Grow(this.chart);
}

FuelGauge.subclassFrom(Graphic);

FuelGauge.methods({
    setVal : function(val) {
        val = Number(val);
        if(this.old_value != val){
            this.chart.value = val;
            RGraph.Effects.Fuel.Grow(this.chart);
            this.old_value = val;
        }
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<canvas class='main' id='drop_canvas-"+this.id+"' width='250' height='250'></canvas></div>";         
        return html;
    },getCustomSettingsForSensor : function(sensor){
        return "<div id='range'> Range:     Min <input type='text' id='min_range-"+this.service_list[sensor]+"' value='"+this.minRange+"'>        Max <input type='text' id='max_range-"+this.service_list[sensor]+"' value='"+this.maxRange+"'></div>";
    }
});

function OdometerGauge(target, idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y, min, max);
    this.type="odometer-gauge";
    // this.minRange=0;//min_gauge_range;
    // this.maxRange=100;//max_gauge_range;

    this.allowed_drop = [sensors_type];
    this.old_value = -1;
    
    this.target.prepend(this.getHTMLContent());
    this.chart = new RGraph.Odometer("drop_canvas-"+this.id, this.minRange, this.maxRange, 0);
    RGraph.Effects.Odo.Grow(this.chart);
}

OdometerGauge.subclassFrom(Graphic);

OdometerGauge.methods({
    setVal : function(val) {
        val = Number(val);
        if(this.old_value != val){
            this.chart.value = val;
            RGraph.Effects.Odo.Grow(this.chart);
            this.old_value = val;
        }
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<canvas class='main' id='drop_canvas-"+this.id+"' width='250' height='250'></canvas></div>";         
        return html;
    },
    getCustomSettingsForSensor : function(sensor){
        return "<div id='range'> Range:     Min <input type='text' id='min_range-"+this.service_list[sensor]+"' value='"+this.minRange+"'>        Max <input type='text' id='max_range-"+this.service_list[sensor]+"' value='"+this.maxRange+"'></div>";
    }
});


function CheckBoxGauge(target, idChart, X, Y){
    arguments.callee.superConstructor.call(this, target, idChart, X, Y);
    this.type="checkbox-gauge";
    //this.minRange=min_gauge_range;
    //this.maxRange=max_gauge_range;

    this.allowed_drop = [actuators_type];
    
    this.target.prepend(this.getHTMLContent());

    //$("#drop_canvas-"+this.id+"[type=checkbox]").switchButton({
    $("#checkbox-"+this.id+"[type=checkbox]").switchButton({
                width: 80,
                height: 40,
                button_width: 60,
                on_label: "1",
                off_label: "0",
            });

    $(document).on("change", "#checkbox-"+this.id, function(event){
        var val = (event.target.checked) ? 1 : 0;
        var id = event.target.id.split("-")[1];
        var graphic = charts_presentation[id];        
        try{
            graphic.setVal(val);
        }
        catch(e){
            console.log("Cannot set value in build mode");
            event.target.checked(0);
        }
    });
}


CheckBoxGauge.subclassFrom(Graphic);

CheckBoxGauge.methods({
    changeVal : function(val){
        val = (val == 0) ? false : true;
        //alert("set " + val + " on "+this.id);
        //alert($("#checkbox-"+this.id));
        $("#checkbox-"+this.id).attr('checked', val);
    },
    setVal : function(val) {
        //this.chart.value = val;
        //RGraph.Effects.Odo.Grow(this.chart);
        if(this.service_list.length>0){
            var service = sensors[this.service_list[0]];
            service.setValue([val],
                function(actuatorEvent){},
                function(actuatorError){}
            );
        }
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<div class='checkboxgauge' id='drop_canvas-"+this.id+"'><input id='checkbox-"+this.id+"' type='checkbox' value='0'></div></div>";
        return html;
    },
    getCustomSettingsForSensor : function(sensor){
        return "<div id='range'> Range:     Min <input type='text' id='min_range-"+this.service_list[sensor]+"' value='"+this.minRange+"'>        Max <input type='text' id='max_range-"+this.service_list[sensor]+"' value='"+this.maxRange+"'></div>";
    },
    startListen : function(){
        if(this.service_list && this.service_list[0])
            sensors[this.service_list[0]].addEventListener('actuator', this.onActuatorEvent , false);
    }
});