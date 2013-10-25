/*   Known problems
 * 
 *
*/
    




var charts={};				//contain Graphic instances
var debug;
var sensors_type = "http://webinos.org/api/sensors";
var geolocation_type = "http://www.w3.org/ns/api-perms/geolocation";
var actuators_type = "http://webinos.org/api/actuators";

var explorer_enabled = true;
var element_counter = 0;

var num_services = 0;
var count_services = 0;
var services_to_handle = {};

var found_services = [];

var service_types = [
    "http://www.w3.org/ns/api-perms/geolocation",
    "http://webinos.org/api/sensors/*",
    "http://webinos.org/api/actuators/*"
];


google.load("visualization", "1", {packages:["corechart"]});

var sensors = {};
var sensors_configuration = {};		//to store sensor's rate,timeout and mode 
var sensorActive = {};
var listeners = new Array();

var listeners_numbers={};	//for counting the number of listeners per sensor

var chart_selected;
var charts_to_fade=[];

var min_temperature_range=-30;
var max_temperature_range=70;

var min_gauge_range=-10;
var max_gauge_range=65;
var lineColor=['blue','red','orange','green','violet','brown','pink','yellow'];

var onGeolocationEvent = function(event){
    var data = {};
    data.type = geolocation_type;
    data.value = {latitude:event.coords.latitude, longitude:event.coords.longitude};
    
    // horrible workaround. The problem is that a geolocation event doesn't contain a service id
    var id;
    for(var i in sensors){
        if(sensors[i].api == geolocation_type){
            id = sensors[i].id;
            break;
        }
    }
    updateUI(id,data);
}

var onSensorEvent = function(event){
    var sensor = sensors && sensors[event.sensorId];    
    if(sensor){
        var value= event.sensorValues[0] || 0;
        // var data = {};
        // data.type = sensors_type;
        // data.value = value;

        for(var i in services_to_handle[sensor.id]){
            var graphic= services_to_handle[sensor.id][i];
            graphic.values=[];
            if(in_array(sensor.id,graphic.service_list)&&(graphic.sensor_active[sensor.id]==true)){
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
                else if(graphic.type == "google-map"){
                    graphic.setCenter(0,value);
                    graphic.addMarker(0,value);
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


function save_services(ask){
    __Utilities__save_file(sensors, "hub_presentation_explorer.txt", ask);
}

function load_services(ask){
     __Utilities__load_file("hub_presentation_explorer.txt",
        function(contents){
            var leftColumn = $('#leftcolumn');
            //num_services = Object.keys(contents).length;
            discover_services(null, contents);
        },
        function(error){
            alert(error.message);
        }, ask
    );
}

function save_graphics(){
    var tmp_array = [];
    for(var elem in charts){
        var graphic= charts[elem];
        tmp_array.push(graphic.toObject());
    }
    __Utilities__save_file(tmp_array,"hub_presentation_page.txt", true);
}

var graphics_content;

function load_graphics(ask){
    if(ask == null)
        ask = true;
    __Utilities__load_file("hub_presentation_page.txt",
        function(contents){
            graphics_content = content;
            //clearAll_for_graphics();
            for(var i in contents){

                var service_ok = false;
                for(var j in contents[i].service_list){
                    var tmp_service = contents[i].service_list[j];
                    
                    if(found_services.indexOf(tmp_service.id) != -1)
                        service_ok = true;
                }

                if(service_ok){
                    var graphic;
                    var idChart = "chart_" + (element_counter++);
                    var X = contents[i].coord.x;
                    var Y = contents[i].coord.y;

                    if(contents[i].type == "gauge")
                        graphic = new Gauge(idChart, X, Y);
                    else if(contents[i].type == "thermometer"){
                        graphic = new Thermometer(idChart, X, Y);
                    }
                    else if(contents[i].type == "text-label"){
                        graphic = new TextLabel(idChart, X, Y);
                    }
                    else if(contents[i].type == "line-chart"){
                        graphic = new LineChart(idChart, X, Y);
                    }
                    else if(contents[i].type == "historical-chart"){
                        graphic = new HistoricalChart(idChart, X, Y);
                    }
                    else if(contents[i].type == "google-map"){
                        graphic = new GoogleMap(idChart, X, Y);
                    }
                    else if(contents[i].type == "corner-gauge"){
                        graphic = new CornerGauge(idChart, X, Y);
                    }
                    else if(contents[i].type == "fuel-gauge"){
                        graphic = new FuelGauge(idChart, X, Y);
                    }
                    else if(contents[i].type == "odometer-gauge"){
                        graphic = new OdometerGauge(idChart, X, Y);
                    }
                    else if(contents[i].type == "checkbox-gauge"){
                        graphic = new CheckBoxGauge(idChart, X, Y);
                    }
                    else
                        continue;


                    charts[idChart]=graphic;

                    var d = document.getElementById("main-"+idChart);
                    d.style.left = graphic.coord.x+'px';
                    d.style.top = graphic.coord.y+'px';

                    // var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
                    // jsPlumb.draggable(divsWithWindowClass);

                    // enableDragAndDropSensors("drop_canvas-"+idChart);   
                     enableButtonsLive(idChart);

                    for(var j in contents[i].service_list){
                        var tmp_service = contents[i].service_list[j];
                        assign_services_to_graphics(tmp_service.id, graphic);
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
    service.bind({
        onBind:function(){

            console.log("Service "+service.api+" bound");
            sensors[service.id] = service;
            
            //load_graphics(false);

            if(service.api.indexOf(sensors_type) != -1){
                var configure_options = {
                    rate:500,
                    timeout:500,
                    eventFireMode: "fixedinterval"
                };

                sensors_configuration[service.id]= configure_options;
                service.configureSensor(configure_options, 
                    function(){
                    },
                    function (){
                        console.error('Error configuring Sensor ' + service.api);
                    }
                );
            }

            //alert(count_services +"=="+ num_services);
            if(++count_services == num_services){
                load_graphics(false);
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

function discover_services(container, filter){
    jQuery("#sensors_table").empty();
    for ( var i in service_types) {
        var type = service_types[i];
        webinos.discovery.findServices(new ServiceType(type), {
            onFound: function (service) { 
                //sensorActive[service.id] = false;
                if(!filter || (filter && filter[service.id])){
                    
                    if(found_services.indexOf(service.id) == -1){
                        //alert("add " + service.id);
                        num_services++;
                        bindProperService(service);
                        found_services.push(service.id);
                    }
                }
            }
        });
    }
}


function discover_filesystem(){
	webinos.discovery.findServices(new ServiceType("http://webinos.org/api/*"), {
		onFound: function (service) {
			if(service.api.indexOf("file") !== -1){
				if(service.serviceAddress === webinos.session.getPZPId()){
					service.bindService({
						onBind: function () {
							service.requestFileSystem(1, 1024, 
								function (filesystem) {
									root_directory = filesystem.root;

                                    //if(explorer_enabled)
                                        load_services(false);
                                     
                                     //load_graphics(false);
								},
								function (error) {
									alert("Error requesting filesystem (#" + error.code + ")");
								}
							);					
						}
					});
				}
			}
		}
	});
}



function assign_services_to_graphics(service_selected, graphic){
    if(!in_array(service_selected,graphic.service_list)){
        
        if(sensors[service_selected].api.indexOf(sensors_type) != -1){
            //add event listener
            //GLT new engine --------------
            if(!services_to_handle[service_selected]){
                services_to_handle[service_selected] = [];
                sensors[service_selected].addEventListener('sensor', onSensorEvent, false);
            }
            services_to_handle[service_selected].push(graphic);

            //sensors[service_selected].addEventListener('sensor', onSensorEvent, false);
            //------------------------------
        }
        else if(sensors[service_selected].api.indexOf(geolocation_type) != -1){
            service_ok = true;
            var PositionOptions = {};
            PositionOptions.enableHighAccuracy = true;
            //PositionOptions.maximumAge = 1000;
            PositionOptions.timeout = 1000;
            //sensors[service_selected].watchPosition(onGeolocationEvent, error, PositionOptions);
            navigator.geolocation.watchPosition(onGeolocationEvent, error, PositionOptions);
        }
        else if(sensors[service_selected].api.indexOf(actuators_type) != -1){
        }
        
        listeners_numbers[service_selected]=0;
        graphic.sensor_active[service_selected] = true;
        listeners_numbers[service_selected]++;
       
        if(graphic.type!="line-chart"){
            if(graphic.service_list[0]!=null){
                removeSensor(graphic,graphic.service_list[0]);
            }
            
            graphic.service_list[0]=service_selected;       //link new sensor to the gauge
            graphic.serviceAddress_list[0]=sensors[service_selected].serviceAddress;
            $('#name-'+graphic.id).text(sensors[service_selected].description);
        }
        else{
            if(graphic.service_list.length==0){
                graphic.graphData.removeColumn(1);
            }
            graphic.service_list.push(service_selected);
            graphic.serviceAddress_list.push(sensors[service_selected].serviceAddress);
            graphic.graphData.addColumn('number',sensors[service_selected].description);
        }

        $(document).on("click", '#startstop_cfg_but-'+graphic.id+'-'+service_selected, function(event){
            startStopSensor(graphic.id,service_selected);
        });
        
        $(document).on("click", '#remove_sensor-'+graphic.id+'-'+service_selected, function(event){
            removeSensor(graphic,service_selected);
        });
    }
    else
        alert("Not allowed - This sensor is already in this graph");
}


function enableButtonsLive(idChart){
	//$('#delete-'+idChart).live( 'click',function(event){
    // $(document).on("click", '#delete-'+idChart, function(event){
    //  	deleteChart(this.id.split('-')[1]);
    //  });


	//$('#settings-'+idChart).live( 'click',function(event){
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
	 
	 //SAVE BUTTON
     //$('#save_cfg_but-'+idChart).live( 'click',function(event){
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
     				var chart=new RGraph.Gauge("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
     				graphic.chart=chart;
     			}
                else if(graphic.type=='thermometer'){
     				$("#drop_canvas-"+idChart).empty();
     				var chart=new RGraph.Thermometer("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
     				graphic.chart=chart;
     			}
                else if(graphic.type=='fuel-gauge'){ //NOTE: this component gives some problems while changing settings
                    $("#drop_canvas-"+idChart).remove();
                    var chart=new RGraph.Fuel("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
                    graphic.chart=chart;
                    
                    //GLT
                    // var tmp_service_list = graphic.service_list
                    // var tmp_coord = graphic.coord;

                    // var tmp_minrange = graphic.minRange;
                    // var tmp_maxrange = graphic.maxRange;

                    // $("#main-"+idChart).remove();
                    // graphic = new FuelGauge(idChart, tmp_coord.x , tmp_coord.y, tmp_minrange, tmp_maxrange);
                    // graphic.service_list = tmp_service_list;
                    
                    // charts[idChart] = graphic;
                    // var d = document.getElementById("main-"+idChart);
                    // d.style.left = graphic.coord.x+'px';
                    // d.style.top = graphic.coord.y+'px';
                }
                else if(graphic.type=='corner-gauge'){
                    $("#drop_canvas-"+idChart).empty();
                    var chart=new RGraph.CornerGauge("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
                    graphic.chart=chart;
                }
                else if(graphic.type=='odometer-gauge'){
                    $("#drop_canvas-"+idChart).empty();
                    var chart=new RGraph.Odometer("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
                    graphic.chart=chart;
                }
     			else if (graphic.type=='line-chart'){
     				color[sensor]=$("#cfg_color-"+graphic.service_list[sensor]).val();
         			graphic.options.colors[sensor]=color[sensor];
     			}
     			sensors_configuration[graphic.service_list[sensor]]={
					rate:urate,
					time:utime,
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
                    ;//handle;
                }
                else if(sensors[graphic.service_list[sens]].api.indexOf(sensors_type) != -1){
                    sensors[graphic.service_list[sens]].removeEventListener('sensor', onSensorEvent, false);
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

function startStopSensor(chartId,sid){
	if(charts[chartId].sensor_active[sid] == true){	//stop the sensor listening
        for(var i in services_to_handle[sid]){
            $('#startstop_cfg_but-'+services_to_handle[sid][i].id+'-'+sid).prop('value','Start');    
            charts[services_to_handle[sid][i].id].sensor_active[sid] = false;
        }
		
		
		listeners_numbers[sid]--;
		if(listeners_numbers[sid]==0){
			sensors[sid].removeEventListener('sensor', onSensorEvent, false);
			delete listeners_numbers[sid];
		}	
	}else{	//active the sensor listening
        for(var i in services_to_handle[sid]){
            $('#startstop_cfg_but-'+services_to_handle[sid][i].id+'-'+sid).prop('value','Stop');    
            charts[services_to_handle[sid][i].id].sensor_active[sid] = true;
        }
		//charts[chartId].sensor_active[sid] = true;
		//$('#startstop_cfg_but-'+chartId+'-'+sid).prop('value','Stop');
		
		if(!listeners_numbers.hasOwnProperty(sid)){
			//add event listener
			sensors[sid].addEventListener('sensor', onSensorEvent, false);
			charts[chartId].sensor_active[sid]=true; 
            listeners_numbers[sid]=0;
		}
        listeners_numbers[sid]++;
	}
}


function in_array(val, reference_array) {
    for(i = 0; i < reference_array.length; i++) {
		if(val == reference_array[i]) {
		    return true;
		}
    }
    return false;
}