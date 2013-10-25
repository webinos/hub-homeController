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




function Graphic(idChart, X, Y) {
    this.id = idChart;
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
    this.minRange;
    this.maxRange;
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
                html+= "<div id='timeout'> Timeout <input type='text' id='cfg_timeout-"+this.service_list[sensor]+"' class='cfg_element' value='"+sensors_configuration[this.service_list[sensor]].time+"'></div>";                    
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
        tmp["coord"] = {
            x: $("#main-"+this.id).position().left,
            y: $("#main-"+this.id).position().top
        }
        return tmp;
    }
});



function Thermometer(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);
    
    this.type="thermometer";
        this.minRange=min_temperature_range;
        this.maxRange=max_temperature_range;
    
    this.allowed_drop = [sensors_type];
    this.old_value = -1;

    $("#target").prepend(this.getHTMLContent());
    this.chart = new RGraph.Thermometer("drop_canvas-"+this.id, min_gauge_range, max_gauge_range, 0);
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


function Gauge(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);
    this.type="gauge";
    this.minRange=min_gauge_range;
    this.maxRange=max_gauge_range;

    this.allowed_drop = [sensors_type];
    this.old_value = -1;

    $("#target").prepend(this.getHTMLContent());
    this.chart = new RGraph.Gauge("drop_canvas-"+this.id, min_gauge_range, max_gauge_range, 0);
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


function TextLabel(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);

    this.type="text-label";
    this.allowed_drop = [sensors_type, geolocation_type];

    $("#target").prepend(this.getHTMLContent());
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


function LineChart(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);
    this.type="line-chart";
    
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

    this.allowed_drop = [sensors_type, geolocation_type];

    $("#target").prepend(this.getHTMLContent());
    var chart_div = document.getElementById('chart_div-'+idChart);
    this.chart = new google.visualization.LineChart(chart_div);
    this.chart.draw(this.graphData, this.options);
}

LineChart.subclassFrom(Graphic);

LineChart.methods({
    setVal : function(val) {
        alert("check here");
        //this.chart.value = val;
        //RGraph.Effects.Gauge.Grow(this.chart);
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
var data = [
      ["20131001",10,100],
      ["20131002",20,80],
      ["20131003",50,60],
      ["20131004",70,80]
    ];

  function getData(){
    var result = "Date,NY,SF\n";

    for(var i=0; i<data.length; i++)
      result += data[i][0] + "," + (data[i][1]-5) + ";" + data[i][1] + ";" + (data[i][1]+5) + "," + (data[i][2]-5) + ";" + data[i][2] + ";" + (data[i][2]+5) + "\n";
    return result;
  }
//---------------------------------------------------

function HistoricalChart(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);
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

    $("#target").prepend(this.getHTMLContent());
    var chart_div = document.getElementById('chart_div-'+idChart);

    g1 = new Dygraph(
          chart_div,
          getData(),
            // {
            //     legend: 'always',
            //     title: 'NYC vs. SF',
            //     showRoller: true,
            //     rollPeriod: 14,
            //     customBars: true,
            //     ylabel: 'Temperature (F)',
            // }
          {
            customBars: true,
            title: 'Daily Temperatures in New York vs. San Francisco',
            ylabel: 'Temperature (F)',
            legend: 'always',
            labelsDivStyles: { 'textAlign': 'right' },
            showRangeSelector: true
          }
      );
    // this.chart = new google.visualization.LineChart(chart_div);
    // this.chart.draw(this.graphData, this.options);
}

HistoricalChart.subclassFrom(Graphic);

HistoricalChart.methods({
    setVal : function(val) {
        // this.chart.value = val;
        // RGraph.Effects.Gauge.Grow(this.chart);
    },
    getHTMLContent : function(){
        var html = arguments.callee.superFunction.call(this);
        html += "<div class='' id='drop_canvas-"+this.id+"'></div>";
        html += "<div id='chart_div-"+this.id+"' class='line-chart'></div>";
        return html;
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


function GoogleMap(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);

    this.type="google-map";
    this.marker;
    this.latitude = 0;
    this.longitude = 0;

    this.allowed_drop = [geolocation_type];

    $("#target").prepend(this.getHTMLContent());

    //var latlng = new google.maps.LatLng(this.latitude,this.longitude);
    var latlng = new google.maps.LatLng(42.745334,12.738430);
    var options = { zoom: 12,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        draggable : false
    };

    //this.chart = new google.maps.Map(document.getElementById("drop_canvas-"+this.id), options);

    var chart_div = document.getElementById('chart_div-'+idChart);
    this.chart = new google.maps.Map(document.getElementById("chart_div-"+this.id), options);        
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

function CornerGauge(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);
    this.type="corner-gauge";
    this.minRange=min_gauge_range;
    this.maxRange=max_gauge_range;

    this.allowed_drop = [sensors_type];
    
    this.old_value = -1;
    
    $("#target").prepend(this.getHTMLContent());
    this.chart = new RGraph.CornerGauge("drop_canvas-"+this.id, min_gauge_range, max_gauge_range, 0);
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

function FuelGauge(idChart, X, Y, min, max){
    arguments.callee.superConstructor.call(this, idChart, X, Y);
    this.type="fuel-gauge";
    this.minRange= (min)?min:0; //min_gauge_range;
    this.maxRange= (max)?max:100; //max_gauge_range;

    this.allowed_drop = [sensors_type];
    this.old_value = -1;

    $("#target").prepend(this.getHTMLContent());
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

function OdometerGauge(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);
    this.type="odometer-gauge";
    this.minRange=0;//min_gauge_range;
    this.maxRange=100;//max_gauge_range;

    this.allowed_drop = [sensors_type];
    this.old_value = -1;
    
    $("#target").prepend(this.getHTMLContent());
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


function CheckBoxGauge(idChart, X, Y){
    arguments.callee.superConstructor.call(this, idChart, X, Y);
    this.type="checkbox-gauge";
    //this.minRange=min_gauge_range;
    //this.maxRange=max_gauge_range;

    this.allowed_drop = [actuators_type];
    
    $("#target").prepend(this.getHTMLContent());

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
        var graphic = charts[id];
        graphic.setVal(val);
    });
}


CheckBoxGauge.subclassFrom(Graphic);

CheckBoxGauge.methods({
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
    }
});