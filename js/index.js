/*   Known problems
 * 
 *
*/

var charts={};	//contain Graphic instances
var sensors_type = "http://webinos.org/api/sensors";
var geolocation_type = "http://www.w3.org/ns/api-perms/geolocation";
var actuators_type = "http://webinos.org/api/actuators";
var deviceOrientation_type = "http://webinos.org/api/deviceorientation";

var element_counter = 0;
var last_chart_id;
var service_types = [
    geolocation_type,
    "http://webinos.org/api/sensors/*",
    "http://webinos.org/api/actuators/*",
    deviceOrientation_type
];
var sensors = {};
var services_to_save = {};
var sensors_configuration = {};     //to store sensor's rate,timeout and mode 
var sensorActive = {};
//var listeners = new Array();
var listeners_numbers={};   //for counting the number of listeners per sensor
var local_filesystem;
var remote_filesystems = [];
var chart_selected;
var charts_to_fade=[];

google.load("visualization", "1", {packages:["corechart"]});


function getId(service){
    var deviceName = service.serviceAddress.substr(service.serviceAddress.lastIndexOf("/")+1);
    deviceName = deviceName.split('.').join("");
    return service.id+""+deviceName;
}

function prapareServicesToBeSaved(){
    services_to_save = {};
    for(var i in sensors){
        var tmp = {
            id : sensors[i].id,
            api : sensors[i].api,
            serviceAddress : sensors[i].serviceAddress,
            serviceConfiguration : sensors_configuration[sensors[i].id]
        };
        //services_to_save[sensors[i].id] = tmp;
        //GLT ID
        services_to_save[i] = tmp;
    }
}

function save_services(ask){
    prapareServicesToBeSaved();
    for(var i=0; i<remote_filesystems.length; i++)
        __Utilities__save_file(remote_filesystems[i], services_to_save, "hub_presentation_explorer.txt", ask);  
    __Utilities__save_file(local_filesystem, services_to_save, "hub_presentation_explorer.txt", ask);
}

function load_services(ask){
     __Utilities__load_file(local_filesystem, "hub_presentation_explorer.txt",
        function(contents){
            var leftColumn = $('#leftcolumn');
            leftColumn.tinyscrollbar();
            discover_services(leftColumn, contents);
        },
        function(error){
            alert(error.message);
        }, ask
    );
}

function save_graphics(ask){
    if(ask == undefined)
        ask = true;
    var tmp_array = [];
    for(var elem in charts){
        var graphic= charts[elem];
        tmp_array.push(graphic.toObject());
    }
    var conf;
    if(ask)
        conf = confirm("Do you want to continue saving?");
    else
        conf = true;
    if(conf){
        for(var i=0; i<remote_filesystems.length; i++)
            __Utilities__save_file(remote_filesystems[i], tmp_array,"hub_presentation_page.txt", false);
        __Utilities__save_file(local_filesystem, tmp_array,"hub_presentation_page.txt", false);
    }
}

function load_graphics(){
    __Utilities__load_file(local_filesystem, "hub_presentation_page.txt",
        function(contents){
            //alert(JSON.stringify(contents));
            clearAll_for_graphics();
            for(var i in contents){
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

                var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
                jsPlumb.draggable(divsWithWindowClass);

                enableDragAndDropSensors("drop_canvas-"+idChart);   
                enableButtonsLive(idChart);

                var sl = contents[i].service_list;
                for(var j in sl){
                    for(var z in sensors)
                        if(sensors[z].id == sl[j].id && sensors[z].serviceAddress == sl[j].serviceAddress)
                            assign_services_to_graphics(z, graphic);
                }
            }
        },
        function(error){
            alert(error.message);
        }, true
    )
}

function callExplorer(container) {
    webinos.dashboard
        .open({
                module: 'explorer',
                data: { 
                    service: service_types,
                    multiselect: true
                }

                //data: { service:geolocation_type}
              }
            , function(){ console.log("***Dashboard opened");} )
                .onAction( function (data) { 
                    for(var i in data.result)
                        serviceDiscovery_afterExplorer(container, data.result[i]); 
                }
        );
	}


function error(error) {
    alert('Error: ' + error.message + ' (Code: #' + error.code + ')');
}

function bindProperService(service, save){
    service.bindService({
        onBind:function(){
            console.log("Service "+service.api+" bound");
            var service_app_id = getId(service);
            sensors[service_app_id] = service;

            var icon = icons[service.api] || icons["default"];
            var deviceName = service.serviceAddress.substr(service.serviceAddress.lastIndexOf("/")+1);
            var serviceCode =   "<div id='servicediv_" +service_app_id+"' class='sensor'>"+
                                "<div id='remove_"+service_app_id+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:left; margin-left:10px;'></img></div>"+
                                "<img width='130px' height='130px' src='./assets/images/"+icon+"'' id='"+service_app_id+"' draggable='false' />"+
                                "<div class='service_displayname'>"+service.displayName+"</div>"+
                                "<div class='service_description'>"+service.description+"</div>"+
                                "<div class='service_devicename'>"+deviceName+"</div>"+
                                "</div>";

            
            jQuery("#sensors_table").append(serviceCode);
            
            $(document).on("click", "#remove_"+service_app_id, function(event){

                $("#servicediv_"+service_app_id).unbind('click',this);
                delete sensors[service_app_id];
                save_services(false);
                $("#servicediv_"+service_app_id).remove();
            });
            
            document.getElementById(service_app_id).draggable = true;
            addOnDragStartEndSensors(service_app_id);
            
            var leftColumn = $('#leftcolumn');
            leftColumn.tinyscrollbar();  

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
            }
            if(save)
                save_services(false);   
        }
    });
}


function serviceDiscovery_afterExplorer(container, serviceFilter){
    webinos.discovery.findServices(
        new ServiceType(serviceFilter.api)
      , {
            onFound: function(service){
                if ((service.id === serviceFilter.id) && (service.serviceAddress === serviceFilter.address) /*&& (typeof(sensors[service.id]) === "undefined")*/) {
                    //alert("Add to sensors2");
                    //sensors[service.id] = service;
                    bindProperService(service, true);
//                    save_services(false);
               }
            }
          , onError: error
        }
    );

}

function clearAll_for_graphics(){
    for(var chart in charts){
        var idChart =chart;
        deleteChart(idChart);   
    }
}

jQuery(document).ready(function() {
    
    $(window).on('beforeunload', function(e) {    
        //TODO stop all sensors
        clearAll_for_graphics();
        //return true;
    }); 

	$("#sensor_id_config").hide();
	
    $(document).on("click", "#refresh", function(event){
		var leftColumn = $('#leftcolumn');
		leftColumn.tinyscrollbar();
		callExplorer(leftColumn);
	});
	
    $(document).on("click","#clearCharts", function(event){
	  clearAll_for_graphics();
	});

    $(document).on("click","#saveCharts", function(event){
        save_graphics();
    });

    $(document).on("click","#loadCharts", function(event){
        load_graphics();         
    });		
	

	var leftColumn = $('#leftcolumn');
	leftColumn.tinyscrollbar();

    var rightColumn = $('#rightcolumn');
    rightColumn.tinyscrollbar();

    var contentDiv = $('#content');
    contentDiv.tinyscrollbar();
    $("#refresh").text("Add From Explorer").button("refresh");

	discover_filesystem();
	$(window).resize(function() {
        leftColumn.tinyscrollbar_update();
        contentDiv.tinyscrollbar_update();
        rightColumn.tinyscrollbar_update();
    });

	initDragAndDropGauges(contentDiv);

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

                //if( (!saved_services || (saved_services && saved_services[service.id])) /*&& (typeof(sensors[service.id]) === "undefined")*/){
                if( (!saved_services || (saved_services && saved_services[service_app_id])) /*&& (typeof(sensors[service.id]) === "undefined")*/){
                    //if(saved_services[service.id].serviceAddress == service.serviceAddress){
                    if(saved_services[service_app_id].serviceAddress == service.serviceAddress){
                        //sensors_configuration[service.id] = saved_services[service.id]["serviceConfiguration"];
                        sensors_configuration[service_app_id] = saved_services[service_app_id]["serviceConfiguration"];
                        bindProperService(service, false);
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
							//root_directory = filesystem.root;
                            if(service.serviceAddress === webinos.session.getPZPId()){
                                local_filesystem = filesystem.root;
                                load_services(false);
                            }
                            else{
                                remote_filesystems.push(filesystem.root);
                            }
						},
						function (error) {
							alert("Error requesting filesystem (#" + error.code + ")");
						}
					);					
				}
			});
		}
	});
}


//only for gauges
var addOnDragStartGauges = function(){

	var gaugesList = $('#gauges_list').children();
	var target = document.getElementById("target");

	gaugesList.each(function() {
        try{
	       var id = $(this).prop("id");
        
            var elem = document.getElementById(id);
            
            elem.ondragstart = function(event) {
        		event.dataTransfer.setData("gauges", id);
        		target.className = "scroll-overview target"; //indicate droppable area
        	}
        	elem.ondragend = function(event) {
        		target.className = "scroll-overview";
        	}
        }
        catch(err){}
	});
}

//set onDragStart for all types of boxes
var addOnDragStart = function(id){

	
	var box = document.getElementById(id);
	box.draggable = true;
	box.ondragstart = function(event) {
		event.dataTransfer.setData("boxes", id);
	}
}

var addDragEventsForGaugesOnTarget = function(contentDiv){

	var target = document.getElementById("target");

    target.ondrag = function(event){
        var idChart = event.target.id.split('-')[1];
        var graphic = charts[idChart];
        graphic.coord.x = event.pageX;
        graphic.coord.x = event.pageY;
    }
	target.ondragenter = function(event){
		//add class "valid"
		//this.className = "scroll-overview valid";
	}

	target.ondragleave = function(event){
		//remove class "valid"
		this.className = "scroll-overview target";
	}

	target.ondragover = function(event){
		event.preventDefault();
		return false;
	}

	target.ondrop = function(event){
		if(event.preventDefault){
			event.preventDefault(); 
		}
		//remove class "valid"
		this.className = "scroll-overview";
		
		try{
    		// var X = event.layerX - $(event.target).position().left;
    		// var Y = event.layerY - $(event.target).position().top;
            var X = event.layerX-140;
            var Y = event.layerY-140;
    		var gauge_selected = event.dataTransfer.getData("gauges");
    		var idChart = "chart_" + (element_counter++);

    		
            var graphic= new Graphic();
    		
    		if(gauge_selected == "btnGauge"){
    			graphic = new Gauge(idChart, X, Y);
    		}
    		else if(gauge_selected == "btnTherm"){
    			graphic = new Thermometer(idChart, X, Y);
    		}
    		else if(gauge_selected == "text-label"){
    			graphic = new TextLabel(idChart, X, Y);
    		}
    		else if(gauge_selected == "line-chart"){
    			graphic = new LineChart(idChart, X, Y);
    		}
            else if(gauge_selected == "btnHistorical"){
                graphic = new HistoricalChart(idChart, X, Y);
            }
            else if(gauge_selected == "google-map"){
                graphic = new GoogleMap(idChart, X, Y);
            }
            else if(gauge_selected == "btnCorner"){
                graphic = new CornerGauge(idChart, X, Y);
            }
            else if(gauge_selected == "btnFuel"){
                graphic = new FuelGauge(idChart, X, Y);
            }
            else if(gauge_selected == "btnOdometer"){
                graphic = new OdometerGauge(idChart, X, Y);
            }
            else if(gauge_selected == "btnCheckBox"){
                 graphic = new CheckBoxGauge(idChart, X, Y);
            }
            else{
                if(!gauge_selected)
                    alert("You have to drag a gauge from the right bar first");
                else
                    alert("This component has not been implemented");
                return;
            }

    		charts[idChart]=graphic;

    		var d = document.getElementById("main-"+idChart);
        	d.style.left = graphic.coord.x+'px';
        	d.style.top = graphic.coord.y+'px';

    		var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
    		jsPlumb.draggable(divsWithWindowClass);


    		enableDragAndDropSensors("drop_canvas-"+idChart);	
    		enableButtonsLive(idChart);

    		contentDiv.tinyscrollbar_update();

    		event.stopPropagation();
        }
        catch(e){
            alert(e.message);
        }
	};
};


var initDragAndDropGauges = function(contentDiv){
	addOnDragStartGauges();
	addDragEventsForGaugesOnTarget(contentDiv);
};

//only for input elements
var addOnDragStartEndSensors = function(ids){
	
	var service = document.getElementById(ids);
	service.ondragstart = function(event) {

		event.dataTransfer.setData("service", service.id);
		for(var graphic in charts){
			if(charts[graphic].type=="line-chart" || charts[graphic].type=="google-map")
				$('#drop_canvas-'+charts[graphic].id).addClass("drop_div");
		}
	};
	service.ondragend = function(event) {
		for(var graphic in charts){
			if(charts[graphic].type=="line-chart" || charts[graphic].type=="google-map" )
				$('#drop_canvas-'+charts[graphic].id).removeClass("drop_div");
		}
	};
};


var addDragEventsForSensorsOnGauge = function(idChart){
	var target = document.getElementById(idChart);

	target.ondragover = function(event){
		event.preventDefault();
		event.stopPropagation();
		return false;
	};
	
	target.ondragenter = function(event){
			//add class "valid"
		event.stopPropagation();
		var idChart_selected = event.target.id.split('-')[1];
        
        if(idChart_selected != undefined)
            last_chart_id = idChart_selected;
        
        if(idChart_selected){
    		if(charts[idChart_selected].type!="line-chart")
    			;//this.className = "main_valid";
    		else{
    			charts[idChart_selected].options['backgroundColor'] = "yellow";
    			charts[idChart_selected].chart.draw(charts[idChart_selected].graphData, charts[idChart_selected].options);			
    		}
        }
	};

	target.ondragleave = function(event){
		//remove class "valid"
		event.stopPropagation();
		var idChart_selected = event.target.id.split('-')[1];

        if(idChart_selected){
            if(charts[idChart_selected].type!="line-chart")
                ;//	this.className = "main";
            else{
                charts[idChart_selected].options['backgroundColor'] = "";
                charts[idChart_selected].chart.draw(charts[idChart_selected].graphData, charts[idChart_selected].options);
            }
        }
	};

		//INPUT ELEMENT ON CHART
	target.ondrop = function(event){
		if(event.preventDefault){
			event.preventDefault();
		}
		//stop events fire
		event.stopPropagation();
		
		var service_selected = event.dataTransfer.getData("service");
		var idChart_selected = event.target.id.split('-')[1];
        if (idChart_selected == undefined && last_chart_id != undefined)
            idChart_selected = last_chart_id;
		
		var graphic=charts[idChart_selected];
		
        try{
            if(graphic.canDrop(sensors[service_selected].api)){
                if(service_selected!=''){
                    assign_services_to_graphics(service_selected, graphic);
                    $('#'+idChart_selected).removeClass("drop_div");
                    if(charts[idChart_selected].type == "text-label")
                        this.className = "text-label";
                    else if(graphic.type=="checkbox-gauge"){
                        //sensors[service_selected].addEventListener("actuator", onActuatorEvent, false);
                    }
                    else if(graphic.type!="line-chart"){
                        this.className = "main";
                    }else{
                        graphic.options['backgroundColor'] = "";
                        graphic.chart.draw(graphic.graphData, graphic.options);
                    }
                }
                else
                    alert("Not allowed");
    			
            }
            else
                alert("This drop is not allowed");
        }
        catch(e){
            alert("This drop is not allowed");   
        }
	};
};


function assign_services_to_graphics(service_app_id, graphic){
    //if(!in_array(service_app_id,graphic.service_list)){
    if(graphic.service_list.indexOf(service_app_id) == -1){
        if(!listeners_numbers.hasOwnProperty(service_app_id)){
            if(sensors[service_app_id].api.indexOf(sensors_type) != -1){

                //check
                // if(graphic.type == 'line-chart')
                //     graphic.allowed_drop = [sensors_type];
            }
            else if(sensors[service_app_id].api.indexOf(geolocation_type) != -1){
            }
            else if(sensors[service_app_id].api.indexOf(actuators_type) != -1){
            }
            else if(sensors[service_app_id].api.indexOf(deviceOrientation_type) != -1){
                
                //check
                // if(graphic.type == 'line-chart')
                //     graphic.allowed_drop = [deviceOrientation_type];
            }
            listeners_numbers[service_app_id]=0;
        }
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
    else
        alert("This service is already associated to this graph");
}

function enableDragAndDropSensors(idChart){
	for(var sid in sensors){
		//enable drag and drop of element removed
		document.getElementById(sid).draggable = true;
		//handler drag and drop
		addOnDragStartEndSensors(sid);
	}
	addDragEventsForSensorsOnGauge(idChart);
}


function enableButtonsLive(idChart){
	//$('#delete-'+idChart).live( 'click',function(event){
    $(document).on("click", '#delete-'+idChart, function(event){
     	deleteChart(this.id.split('-')[1]);
     });


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
                    RGraph.Effects.Gauge.Grow(graphic.chart);
     			}
                else if(graphic.type=='thermometer'){
     				$("#drop_canvas-"+idChart).empty();
     				var chart=new RGraph.Thermometer("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
     				graphic.chart=chart;
                    RGraph.Effects.Thermometer.Grow(graphic.chart);
     			}
                else if(graphic.type=='fuel-gauge'){ //NOTE: this component gives some problems while changing settings
                    // $("#drop_canvas-"+idChart).empty();
                    // var chart=new RGraph.Fuel("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
                    // graphic.chart=chart;
                    // RGraph.Effects.Fuel.Grow(graphic.chart);
                }
                else if(graphic.type=='corner-gauge'){
                    $("#drop_canvas-"+idChart).empty();
                    var chart=new RGraph.CornerGauge("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
                    graphic.chart=chart;
                    RGraph.Effects.CornerGauge.Grow(graphic.chart);
                }
                else if(graphic.type=='odometer-gauge'){
                    $("#drop_canvas-"+idChart).empty();
                    var chart=new RGraph.Odometer("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
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
                        save_services(false);
 					},
 					function (){
 						console.error('Error configuring Sensor ' + service.api);
 					}
 				);
            }
      	}
        save_graphics(false);
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
                    //sensors[graphic.service_list[sens]].removeEventListener('sensor', onSensorEvent, false);
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

function removeSensor(graphic, sid){
	listeners_numbers[sid]--;
	delete graphic.sensor_active[sid];
	
	if(graphic.type=='line-chart'){
		graphic.graphData.removeColumn(graphic.service_list.indexOf(sid)+1);
		graphic.service_list.splice(graphic.service_list.indexOf(sid),1);
		if(graphic.service_list.length==0){
			graphic.graphData.addColumn('number',null);		//add a null column only for a graphical aspect
		}
	}else{
		graphic.service_list=[];
		$('#name-'+graphic.id).empty();
	}
	
	if(listeners_numbers[sid]==0){
		//sensors[sid].removeEventListener('sensor', onSensorEvent, false);
		delete listeners_numbers[sid];
	}	
	
	$("#configuration_div-"+graphic.id+"-"+sid).remove();
	$('#remove_sensor-'+graphic.id+'-'+sid).die();		
	$('#startstop_cfg_but-'+graphic.id+'-'+sid).die();
}


function startStopSensor(chartId,sid){
	if(charts[chartId].sensor_active[sid] == true){	//stop the sensor listening
		$('#startstop_cfg_but-'+chartId+'-'+sid).prop('value','Start');
		charts[chartId].sensor_active[sid] = false;
		listeners_numbers[sid]--;
		if(listeners_numbers[sid]==0){
			//sensors[sid].removeEventListener('sensor', onSensorEvent, false);
			delete listeners_numbers[sid];
		}	
	}else{	//active the sensor listening
		charts[chartId].sensor_active[sid] = true;
		$('#startstop_cfg_but-'+chartId+'-'+sid).prop('value','Stop');
		
		if(!listeners_numbers.hasOwnProperty(sid)){
			//add event listener
			//sensors[sid].addEventListener('sensor', onSensorEvent, false);
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