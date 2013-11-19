/*   Known problems
 * 
 *
*/
    
var charts={};				//contain Graphic instances
var sensors_type = "http://webinos.org/api/sensors";
var geolocation_type = "http://www.w3.org/ns/api-perms/geolocation";
var actuators_type = "http://webinos.org/api/actuators";
var deviceOrientation_type = "http://webinos.org/api/deviceorientation";
var element_counter = 0;
var num_services = 0;
var count_services = 0;
var services_to_handle = {};
var services_count = 0;
var configured_services = 0;
var local_filesystem;
var found_services = [];
var service_types = [
    geolocation_type,
    "http://webinos.org/api/sensors/*",
    "http://webinos.org/api/actuators/*",
    deviceOrientation_type
];
var sensors = {};
var sensors_configuration = {};     //to store sensor's rate,timeout and mode 
var sensorActive = {};
var listeners_numbers={};   //to count the number of listeners per sensor
var charts_to_fade=[];

google.load("visualization", "1", {packages:["corechart"]});


function getId(service){
    var deviceName = service.serviceAddress.substr(service.serviceAddress.lastIndexOf("/")+1);
    deviceName = deviceName.split('.').join("");
    return service.id+""+deviceName;
}

var onGeolocationEvent = function(service_app_id, event){
    var data = {};
    data.type = geolocation_type;
    data.value = {latitude:event.coords.latitude, longitude:event.coords.longitude};
    
    for(var i in services_to_handle[service_app_id].graphicslist){
        var graphic= services_to_handle[service_app_id].graphicslist[i];
        if(graphic.type == "google-map"){
            graphic.setCenter(event.coords.latitude, event.coords.longitude);
            graphic.addMarker(event.coords.latitude, event.coords.longitude);
        }
        else if(graphic.type == "line-chart"){
            var time=new Date(event.timestamp);
            time=(time.getUTCHours()+2)+ ":"+time.getUTCMinutes()+":"+time.getUTCSeconds();
            var val = [time, Number(event.coords.latitude), Number(event.coords.longitude)];
            graphic.setGeolocationVal(val);
        }
    }
}

var onSensorEvent = function(sensor_app_id, event){
    var sensor = sensors[sensor_app_id];
    if(sensor){
        if(services_to_handle[sensor_app_id].serviceAddress == sensor.serviceAddress){

            var value= event.sensorValues[0] || 0;
            for(var i in services_to_handle[sensor_app_id].graphicslist){
                var graphic= services_to_handle[sensor_app_id].graphicslist[i];
                graphic.values=[];
                if(graphic.sensor_active[sensor_app_id]==true){
                    if( graphic.type == "gauge" || graphic.type == "corner-gauge" || graphic.type == "fuel-gauge" 
                            || graphic.type == "odometer-gauge" || graphic.type == "thermometer" || graphic.type == "text-label" ){
                        // var normalized_val = value;
                        // if(graphic.maxRange && value > graphic.maxRange)
                        //     normalized_val = graphic.maxRange;
                        // if(graphic.minRange && value < graphic.minRange)
                        //     normalized_val = graphic.minRange;
    //                    graphic.setVal(normalized_val);
                        graphic.setVal(value);
                    }
                    else if(graphic.type == "line-chart"){
                        var time=new Date(event.timestamp);
                        time=(time.getUTCHours()+2)+ ":"+time.getUTCMinutes()+":"+time.getUTCSeconds();
                        var index=graphic.service_list.indexOf(sensor.id);
                        graphic.values.push(time);
                        for(var i=0;i<graphic.service_list.length;i++){
                            if(i==index){
                                graphic.values.push(Number(value));
                            }
                            else{
                                if(graphic.sensor_active[graphic.service_list[i]]==true){
                                    graphic.values.push(graphic.old_values[i+1]);
                                }else{
                                    graphic.values.push(null);
                                }
                            }
                        }
                        graphic.numberOfValues++;
                        graphic.graphData.addRow(graphic.values);
                        graphic.chart.draw(graphic.graphData, graphic.options);
                        graphic.old_values=graphic.values;
                        
                        if(graphic.numberOfValues>150){
                            graphic.graphData.removeRow(0);
                        }
                    }
                }
            }
        }
    }
}

var onDeviceOrientationEvent = function(service_app_id, event){
    var sensor = sensors[service_app_id];
    for(var i in services_to_handle[service_app_id].graphicslist){
        var graphic= services_to_handle[service_app_id].graphicslist[i];
        graphic.values=[];
        if(graphic.type == "text-label" ){
            var text = "<table><tr><td>Alpha</td><td>"+event.alpha+"</td></tr>"+
                       "<tr><td>Beta</td><td>"+event.beta+"</td></tr><tr>"+
                       "<td>Gamma </td><td>"+event.gamma+"</td></tr></table";
            graphic.setVal(text);
        }
        else if(graphic.type == "line-chart" ){
            var time=new Date(event.timestamp);
            time=(time.getUTCHours()+2)+ ":"+time.getUTCMinutes()+":"+time.getUTCSeconds();
            var val = [time, Number(event.alpha), Number(event.beta), Number(event.gamma)];
            graphic.setOrientationVal(val);
        }
    }
}

function load_services(ask){
     __Utilities__load_file(local_filesystem, "hub_presentation_explorer.txt",
        function(contents){
            //num_services = Object.keys(contents).length;
            services_count = Object.keys(contents).length;
            show_wait();
            
            setTimeout(hide_wait,60000,false);
            discover_services(null, contents);
        },
        function(error){
            alert(error.message);
        }, ask
    );
}

function load_graphics(ask){
    if(ask == null)
        ask = true;
    __Utilities__load_file(local_filesystem, "hub_presentation_page.txt",
        function(contents){
            for(var i in contents){
                var service_ok = false;                
                for(var j in contents[i].service_list){
                    var tmp_service = contents[i].service_list[j];
                    var tmp_service_app_id = getId(tmp_service);   
                    if(found_services.indexOf(tmp_service_app_id) != -1)
                        service_ok = true;
                }
                if(service_ok){
                    var graphic;
                    var idChart = "chart_" + (element_counter++);
                    var X = contents[i].coord.x;
                    var Y = contents[i].coord.y;
                    var min = Number(contents[i].minRange);
                    var max = Number(contents[i].maxRange);

                    if(contents[i].type == "gauge")
                        graphic = new Gauge(idChart, X, Y, min, max);
                    else if(contents[i].type == "thermometer"){
                        graphic = new Thermometer(idChart, X, Y, min, max);
                    }
                    else if(contents[i].type == "text-label"){
                        graphic = new TextLabel(idChart, X, Y, min, max);
                    }
                    else if(contents[i].type == "line-chart"){
                        graphic = new LineChart(idChart, X, Y, min, max);
                    }
                    else if(contents[i].type == "historical-chart"){
                        graphic = new HistoricalChart(idChart, X, Y, min, max);
                    }
                    else if(contents[i].type == "google-map"){
                        graphic = new GoogleMap(idChart, X, Y, min, max);
                    }
                    else if(contents[i].type == "corner-gauge"){
                        graphic = new CornerGauge(idChart, X, Y, min, max);
                    }
                    else if(contents[i].type == "fuel-gauge"){
                        graphic = new FuelGauge(idChart, X, Y, min, max);
                    }
                    else if(contents[i].type == "odometer-gauge"){
                        graphic = new OdometerGauge(idChart, X, Y, min, max);
                    }
                    else if(contents[i].type == "checkbox-gauge"){
                        graphic = new CheckBoxGauge(idChart, X, Y, min, max);
                    }
                    else
                        continue;


                    charts[idChart]=graphic;

                    var d = document.getElementById("main-"+idChart);
                    d.style.left = graphic.coord.x+'px';
                    d.style.top = graphic.coord.y+'px';

                    enableButtonsLive(idChart);
                    
                    for(var j in contents[i].service_list){
                        var tmp_service = contents[i].service_list[j];
                        //assign_services_to_graphics(tmp_service.id, graphic);
                        assign_services_to_graphics(tmp_service_app_id, graphic);
                    }
                }
            }
        },
        function(error){
            alert(error.message);
        }, ask
    )
}

function bindProperService(service){
    service.bindService({    
        onBind:function(){
            console.log("Service "+service.api+" bound");
            var service_app_id = getId(service);
            sensors[service_app_id] = service;
            if(service.api.indexOf(sensors_type) != -1){
                var configure_options;
                if(sensors_configuration[service_app_id]){
                    configure_options = sensors_configuration[service_app_id];
                }
                else{
                    configure_options = {
                        rate:1000,
                        timeout:500,
                        eventFireMode: "fixedinterval"
                    };
                    sensors_configuration[service_app_id]= configure_options;
                }
                service.configureSensor(configure_options, 
                    function(){
                        configured_services++;
                    },
                    function (){
                        console.error('Error configuring Sensor ' + service.api);
                    }
                );
            }
            else{
                // TODO :
                // If a service (different from a sensor) is not still available (for example it is on disconnected Arduino board)
                // we should not increment configured_services
                configured_services++;
            }
        }
    });
}

function removeSensorFromExplorer(){

}

function clearAll_for_graphics(){
    for(var chart in charts){

        var idChart =chart;
        deleteChart(idChart);   
    }
}
var intervalwaitid = 0;

var continue_to_wait = true;
var ui_loaded = false;

function show_wait(){
    //alert(configured_services+"---"+services_count);
    if(continue_to_wait){ 
        if(configured_services < services_count){
            $("#wait_div").show();
            setTimeout(show_wait,1000);
        }
        else
            hide_wait(true);
        //$("#wait_div").show();
    }
}

function hide_wait(load){
    $("#wait_div").hide();
    if(load){
        load_graphics(false);
        ui_loaded = true;
    }
    if(!load){
        continue_to_wait = false;
        if(!ui_loaded)
            alert("Error loading remote services");
    }
}

jQuery(document).ready(function() {
    clearAll_for_graphics();

    $(window).on('beforeunload', function(e) {    
        //TODO stop all sensors
        clearAll_for_graphics();
        //return true;
    }); 

    $(document).on("click","#but_home", function(event){
        
        clearAll_for_graphics();
        window.location = "index.html";
    });

	$("#sensor_id_config").hide();
	
    var contentDiv = $('#content');
    contentDiv.tinyscrollbar();

	discover_filesystem();
	$(window).resize(function() {
        contentDiv.tinyscrollbar_update();
    });
	
	var popup = $("#settings-container");
	popup.click(function(){
		/*
		popup.fadeOut();
		for(chart_id in charts_to_fade){
			$("#chart_div-"+charts_to_fade[chart_id]).fadeIn();
	  	}
	  	*/
	});
	

	$("#close").click(function(){
	 	popup.fadeOut();
	 	fadeOutSettings();
	 	// for(chart_id in charts_to_fade){
			// //alert("aa: "+chars_to_fade[chart_id]);
			// $("#chart_div-"+charts_to_fade[chart_id]).fadeIn();
	  // 	}
	});

});

function fadeOutSettings(){
	var popup = $("#settings-container");
	popup.fadeOut();
	//$("#settings_div").fadeOut();
	for(chart_id in charts_to_fade){
		$("#chart_div-"+charts_to_fade[chart_id]).fadeIn();
		charts[charts_to_fade[chart_id]].chart.draw(charts[charts_to_fade[chart_id]].graphData, charts[charts_to_fade[chart_id]].options);
  	}	  
	charts_to_fade=[];
}

function discover_services(container, saved_services){
    jQuery("#sensors_table").empty();
    for ( var i in service_types) {
        var type = service_types[i];
        webinos.discovery.findServices(new ServiceType(type), {
            onFound: function (service) { 
                var service_app_id = getId(service);
                if(!saved_services || (saved_services && saved_services[service_app_id])){
                    if(saved_services[service_app_id].serviceAddress == service.serviceAddress){
                        if(found_services.indexOf(service_app_id) == -1){
                            num_services++;
                            sensors_configuration[service_app_id] = saved_services[service_app_id]["serviceConfiguration"];
                            bindProperService(service);
                            found_services.push(service_app_id);
                        }
                    }
                }
            }
        });
    }
}


function discover_filesystem(){
    webinos.discovery.findServices(new ServiceType("http://webinos.org/api/file"), {
        onFound: function (service) {
            service.bindService({
                onBind: function () {
                    service.requestFileSystem(1, 1024, 
                        function (filesystem) {
                            if(service.serviceAddress === webinos.session.getPZPId()){
                                local_filesystem = filesystem.root;
                                load_services(false);
                            }
                            // else{
                            //     remote_filesystems.push(filesystem.root);
                            // }
                        },
                        function (error) {
                            console.log("Error requesting filesystem (#" + error + ")");
                        }
                    );                  
                }
            });
        }
    });
}

function onPositionError(err){
    //TODO handle
}

function assign_services_to_graphics(service_app_id, graphic){
    //var service_selected = service_app_id.substr(0,32);
    var start = false;

    if(!services_to_handle[service_app_id]){
        services_to_handle[service_app_id] = {};
        services_to_handle[service_app_id]["serviceAddress"] = sensors[service_app_id].serviceAddress;
        services_to_handle[service_app_id]["graphicslist"] = [];
        start=true;
    }
    if(sensors[service_app_id].api.indexOf(sensors_type) != -1){    
        if(start){
            var service_id = service_app_id;
            sensors[service_id].addEventListener('sensor', function(e){onSensorEvent(service_id,e)}, false);
        }
        services_to_handle[service_app_id].graphicslist.push(graphic); 
    }
    else if(sensors[service_app_id].api.indexOf(deviceOrientation_type) != -1){
        if(start){
            var service_id = service_app_id;
            sensors[service_id].addEventListener("deviceorientation", function(e){onDeviceOrientationEvent(service_id,e)}, true);
        }   
        services_to_handle[service_app_id].graphicslist.push(graphic);
    }
    else if(sensors[service_app_id].api.indexOf(geolocation_type) != -1){
        service_ok = true;
        var PositionOptions = {};
        PositionOptions.enableHighAccuracy = true;
        PositionOptions.maximumAge = 1000;
        PositionOptions.timeout = 1000;
        services_to_handle[service_app_id].graphicslist.push(graphic);
        
        var tmpFunction = function(position){
            onGeolocationEvent(service_app_id, position);
        };
        var w_id = sensors[service_app_id].watchPosition(tmpFunction, onPositionError, PositionOptions);          
        //var w_id = navigator.geolocation.watchPosition(onGeolocationEvent, onPositionError, PositionOptions);
        services_to_handle[service_app_id]["watch_id"] = w_id;
    }
    else if(sensors[service_app_id].api.indexOf(actuators_type) != -1){}

    listeners_numbers[service_app_id]=0;
    graphic.sensor_active[service_app_id] = true;
    listeners_numbers[service_app_id]++;
    
    if(graphic.type != "line-chart"){
        if(graphic.service_list[0]!=null){
            removeSensor(graphic,graphic.service_list[0]);
        }
        
        graphic.service_list[0]=service_app_id;       //link new sensor to the gauge
        graphic.serviceAddress_list[0]=sensors[service_app_id].serviceAddress;

        var deviceName = sensors[service_app_id].serviceAddress.substr(sensors[service_app_id].serviceAddress.lastIndexOf("/")+1);
        var title = sensors[service_app_id].description+" @ "+deviceName;
        $('#name-'+graphic.id).text(title);
    }
    else{
        if(graphic.service_list.length==0){
            graphic.graphData.removeColumn(1);
        }

        graphic.service_list.push(service_app_id);
        graphic.serviceAddress_list.push(sensors[service_app_id].serviceAddress);
        graphic.graphData.addColumn('number',sensors[service_app_id].description);
    }

    $(document).on("click", '#startstop_cfg_but-'+graphic.id+'-'+service_app_id, function(event){
        startStopSensor(graphic.id,service_app_id);
    });
    
    $(document).on("click", '#remove_sensor-'+graphic.id+'-'+service_app_id, function(event){
        removeSensor(graphic,service_app_id);
    });
}

function enableButtonsLive(idChart){
    $(document).on("click", '#settings-'+idChart, function(event){
    	$('#settings-content').empty();
     	$("#settings-container").fadeIn(1000);
    	 for(var elem in charts){
    		 var graphic= charts[elem];
    		 if(graphic.type=="line-chart"){
    			 $("#chart_div-"+graphic.id).fadeOut();
    			 charts_to_fade.push(graphic.id);
    		 }
     	 }
     	
     	var graphic=charts[idChart];
    
        var setting_page = graphic.getSettingPage();
        setting_page += " <div id='save_cfg_but-"+idChart+"' class='save_cfg_but'> <input class='button' type='button' value='Save'></div>";
        $('#settings-content').append(setting_page);
    });

    $(document).on("click", '#save_cfg_but-'+idChart, function(event){
 		var graphic=charts[idChart];
 		var color=[];
        
      	for(var sensor in graphic.service_list){
            if(sensors[graphic.service_list[sensor]].api.indexOf(sensors_type) != -1){
          		var urate = $("#cfg_rate-"+graphic.service_list[sensor]).val();
     			var utime = $("#cfg_timeout-"+graphic.service_list[sensor]).val();
     			var umode = $("#cfg_mode-"+graphic.service_list[sensor]).val();
     			graphic.minRange=$("#min_range-"+graphic.service_list[sensor]).val();
     			graphic.maxRange=$("#max_range-"+graphic.service_list[sensor]).val();
                if(graphic.type=='gauge'){
     				$("#drop_canvas-"+idChart).empty();
     				var chart=new RGraph.Gauge("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), graphic.old_value);
     				graphic.chart=chart;
                    RGraph.Effects.Gauge.Grow(graphic.chart);
     			}
                else if(graphic.type=='thermometer'){
     				$("#drop_canvas-"+idChart).empty();
     				var chart=new RGraph.Thermometer("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), graphic.old_value);
     				graphic.chart=chart;
                    RGraph.Effects.Thermometer.Grow(graphic.chart);
     			}
                else if(graphic.type=='fuel-gauge'){ //NOTE: this component gives some problems while changing settings
                    // $("#drop_canvas-"+idChart).remove();
                    // var chart=new RGraph.Fuel("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
                    // graphic.chart=chart;
                }
                else if(graphic.type=='corner-gauge'){
                    $("#drop_canvas-"+idChart).empty();
                    var chart=new RGraph.CornerGauge("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), graphic.old_value);
                    graphic.chart=chart;
                    RGraph.Effects.CornerGauge.Grow(graphic.chart);
                }
                else if(graphic.type=='odometer-gauge'){
                    $("#drop_canvas-"+idChart).empty();
                    var chart=new RGraph.Odometer("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), graphic.old_value);
                    graphic.chart=chart;
                    RGraph.Effects.Odo.Grow(graphic.chart);
                }
     			else if (graphic.type=='line-chart'){
     				color[sensor]=$("#cfg_color-"+graphic.service_list[sensor]).val();
         			graphic.options.colors[sensor]=color[sensor];
     			}
     			sensors_configuration[graphic.service_list[sensor]]={
					rate:urate,
					timeout:utime,
					eventFireMode:umode
    			};
          		sensors[graphic.service_list[sensor]].configureSensor({rate: urate, time: utime, eventFireMode: umode}, 
 					function(){
 					},
 					function (){
 						console.error('Error configuring Sensor ' + service.api);
 					}
 				);
            }
      	}
      	fadeOutSettings();
  	 });     
}


function deleteChart(idChart_selected){
	var graphic= charts[idChart_selected];
	for(var sens in graphic.service_list){
		$('#startstop_cfg_but-'+graphic.id+'-'+graphic.service_list[sens]).die();
		if((listeners_numbers.hasOwnProperty(graphic.service_list[sens]))&&(graphic.sensor_active[graphic.service_list[sens]])){	//if sensor is inactive, the listener is already removed
			listeners_numbers[graphic.service_list[sens]]--;
			if(listeners_numbers[graphic.service_list[sens]]==0){
				if(sensors[graphic.service_list[sens]].api.indexOf(geolocation_type) != -1){
                    //navigator.geolocation.clearWatch(services_to_handle[graphic.service_list[sens]]["watch_id"]);
                    sensors[graphic.service_list[sens]].clearWatch(services_to_handle[graphic.service_list[sens]]["watch_id"]);
                }
                else if(sensors[graphic.service_list[sens]].api.indexOf(sensors_type) != -1){
                    var service_id = graphic.service_list[sens];
                    sensors[service_id].removeEventListener('sensor', function(e){onSensorEvent(service_id,e)}, false);
                }
                else if(sensors[graphic.service_list[sens]].api.indexOf(deviceOrientation_type) != -1){
                    var service_id = graphic.service_list[sens];
                    sensors[service_id].removeEventListener("deviceorientation", function(e){onDeviceOrientationEvent(service_id,e)}, true);
                }
				delete listeners_numbers[graphic.service_list[sens]];
			}		
		}
	}
	
	$("#main-"+idChart_selected).remove();
	$('#delete-'+idChart_selected).die();
	$('#settings-'+idChart_selected).die();
    delete charts[idChart_selected];
}

function startStopSensor(chartId,service_app_id){
	if(charts[chartId].sensor_active[service_app_id] == true){	//stop the sensor listening
        for(var i in services_to_handle[service_app_id].graphicslist){
            $('#startstop_cfg_but-'+services_to_handle[service_app_id].graphicslist[i].id+'-'+service_app_id).prop('value','Start');    
            charts[services_to_handle[service_app_id].graphicslist[i].id].sensor_active[service_app_id] = false;
        }
		listeners_numbers[service_app_id]--;
		if(listeners_numbers[service_app_id]==0){
            var service_id = service_app_id;
            sensors[service_id].removeEventListener('sensor', function(e){onSensorEvent(service_id,e)}, false);
			delete listeners_numbers[service_app_id];
		}	
	}
    else{	//active the sensor listening
        for(var i in services_to_handle[service_app_id].graphicslist){
            $('#startstop_cfg_but-'+services_to_handle[service_app_id].graphicslist[i].id+'-'+service_app_id).prop('value','Stop');    
            charts[services_to_handle[service_app_id].graphicslist[i].id].sensor_active[service_app_id] = true;
        }
		if(!listeners_numbers.hasOwnProperty(service_app_id)){
            var service_id = service_app_id;
            sensors[service_id].addEventListener('sensor', function(e){onSensorEvent(service_id,e)}, false);
			charts[chartId].sensor_active[service_app_id]=true; 
            listeners_numbers[service_app_id]=0;
		}
        listeners_numbers[service_app_id]++;
	}
}