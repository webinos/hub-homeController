var charts={};				//contain Graphic instances
	

//(function(){

	function Gauge(id, type, gauge){
		this.id = 0;
		if(id!=null)
			this.id = id;
		
		this.type = null;
		if(type!=null)
			this.type = type;

		this.gauge = null;
		if(gauge!=null)
			this.gauge = gauge;

		this.sensorID = null;

		//set property of gauges
		this.setProperty = function(propName, propValue){
			if(this.type=="thermometer" && propName=="title")
				this.gauge.Set('chart.title.side', propValue);
			else if(this.type=="gauge" && propName=="title")
				this.gauge.Set('chart.title.bottom', propValue);
			else
				this.gauge.Set(propName, propValue);
		}
	}

	var sensor_types = [
		"http://webinos.org/api/sensors.temperature",
		"http://webinos.org/api/sensors.humidity",
		"http://webinos.org/api/sensors.light",
		"http://webinos.org/api/sensors.voltage",
		"http://webinos.org/api/sensors.electricity",
		"http://webinos.org/api/sensors.proximity",
		"http://webinos.org/api/sensors.heartratemonitor"
	];

	var icons = {
		"http://webinos.org/api/sensors.temperature": "temperature-icon.png",
		"http://webinos.org/api/sensors.humidity": "humidity-icon.png",
		"http://webinos.org/api/sensors.light": "light-icon.png",
		"http://webinos.org/api/sensors.voltage": "voltage-icon.png",
		"http://webinos.org/api/sensors.electricity":"electricity-icon.png",
		"http://webinos.org/api/actuators.switch": "switch-icon.png",
		"http://webinos.org/api/sensors.proximity": "proximity-icon.png",
		"http://webinos.org/api/actuators.linearmotor": "switch-icon.png",
		"http://webinos.org/api/sensors.heartratemonitor": "heartratemonitor-icon.png"
	};

	google.load("visualization", "1", {packages:["corechart"]});
	
	var sensors = {};
	var sensors_configuration = {};		//for storing sensor's rate,timeout and mode 
	var sensorActive = {};
	var listeners = new Array();
	
	var listeners_numbers={};	//for counting the number of listeners per sensor
	
	//var charts={};				//contain Graphic instances
	var chart_selected;
	var charts_to_fade=[];
	
	var min_temperature_range=-30;
	var max_temperature_range=70;
	
	var min_gauge_range=-10;
	var max_gauge_range=65;
	var lineColor=['blue','red','orange','green','violet','brown','pink','yellow'];
	
	
 	function Graphic(chart){
 			this.id='';
 			this.chart = chart;
 			this.sensor_list=[];
 			this.serviceAddress_list=[];
 			this.values=[];
 			this.old_values=[];
 			this.graphData =[];
 			this.numberOfValues=0;
 			this.title='';
 			this.type='';
 			this.options='';
 			this.sensor_active={};
 			this.minRange=0;
 			this.maxRange=0;
 			this.coord = {
 					x:0,
 					y:0
 				}
 	}

	var onSensorEvent = function(event){
		var sensor = sensors && sensors[event.sensorId];
		var value= event.sensorValues[0] || 0;
		var time=new Date(event.timestamp);
		time=(time.getUTCHours()+2)+ ":"+time.getUTCMinutes()+":"+time.getUTCSeconds();
		if(sensor){
			//console.log("************ SENSOR VALURE: " + value);
			for(var elem in charts){
				var graphic= charts[elem];
				graphic.values=[];
			
				if(in_array(sensor.id,graphic.sensor_list)&&(graphic.sensor_active[sensor.id]==true)){		
					if(graphic.type=="thermometer"){
						value_temp=value;
						if(value_temp>graphic.maxRange){
							var value_temp=graphic.maxRange;
						}
						graphic.chart.value = value_temp;
						RGraph.Effects.Thermometer.Grow(graphic.chart);
					}else if(graphic.type=="gauge"){
						graphic.chart.value = value;
						RGraph.Effects.Gauge.Grow(graphic.chart);
					}else if(graphic.type=="line"){
						var index=graphic.sensor_list.indexOf(sensor.id);
						
						graphic.values.push(time);
						for(var i=0;i<graphic.sensor_list.length;i++){
							if(i==index){
								graphic.values.push(value);
							}
							else{
								if(graphic.sensor_active[graphic.sensor_list[i]]==true){
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
	};

	jQuery(document).ready(function() {

		$("#sensor_id_config").hide();
		$('#refresh').live( 'click',function(event){
			var leftColumn = $('#leftcolumn');
			leftColumn.tinyscrollbar();
			discovery_sensors(leftColumn);
			discovery_service_file();
		});
		
		$('#clearCharts').live( 'click',function(event){
			clearAll_for_graphics();
		});

        $('#saveCharts').live( 'click',function(event){
            save_graphics();
        });

        $('#loadCharts').live( 'click',function(event){
            load_graphics();
        });		
		

		var leftColumn = $('#leftcolumn');
		leftColumn.tinyscrollbar();

        var rightColumn = $('#rightcolumn');
        rightColumn.tinyscrollbar();

        var contentDiv = $('#content');
        contentDiv.tinyscrollbar();

		discovery_sensors(leftColumn);
		discovery_service_file();
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


		// initDragAndDropGauges();
		// $("#hover").click(function(){
		// 	fadeOutSettings();  
		// });

		// $("#close").click(function(){
		// 	fadeOutSettings();
		// });
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

	function add_gui_rule(){
		var id=get_next_ID();
		var html="";
		html+= "<div id='exernal_content-"+id+"' class='main_2'>";
        html+= "<div style='clear:both'>";
		html+= "<input type='image' id='delete-"+id+"' src='assets/delete_min.png' alt='delete' style='float:right; padding:5px 5px 5px 5px;' />";
        html+= "<input type='image' id='settings-"+id+"' src='assets/sett_min.png' alt='settings' style='float:right; padding:5px 5px 5px 5px;' />";
        html+= "</div>";
        html+= "<div style='float:left; clear:both;'>";
        html+= "<div id='sensor_div-"+id+"' class='sensorBlock'>Sensors</div>";
        html+= "<div id='operation_div-"+id+"' class='operationBlock'>Operation</div>";
        html+= "<div id='actuator_div-"+id+"' class='actuatorBlock'>Actuator</div>";
        html+= "</div>";
        html+= "<div style='float:left;'>";
        html+= "<div id='chart_div-"+id+"' class='graphBlock'>Graph or Gauges</div>";
        html+= "</div>";
        html+= "</div>";

		$('#content').append(html);        
	}

	function get_next_ID(){
		var boxes = $('#content').children();
		var num = 0;
		boxes.each(function() {
		    num++;
		});
		num = num + 1;
		return num;
	}

	function discovery_sensors(container){
		jQuery("#sensors_table").empty();

		for ( var i in sensor_types) {
			var type = sensor_types[i];
			webinos.discovery.findServices(new ServiceType(type), {
				onFound: function (service) {
					sensors[service.id] = service;
					//sensorActive[service.id] = false;
					service.bind({
						onBind:function(){
		        			console.log("Service "+service.api+" bound");
		        			console.log(service);
		        			//---- save sensors_configuration information
		        			sensors_configuration[service.id]={
		        					rate:500,
		        					time:500,
		        					eventFireMode: "fixedinterval"
		        			};
		        			service.configureSensor({rate: 500, time: 500, eventFireMode: "fixedinterval"}, 
		        				function(){
		        					var sensor = service;
                                    var sensorCode = '<div class="sensor"><img width="120px" height="120px" src="./assets/images/'+icons[sensor.api]+'" id="'+sensor.id+'" draggable="false" /><p>'+sensor.description+'</p></div>';

                                    jQuery("#sensors_table").append(sensorCode);
                                    container.tinyscrollbar_update();

								},
								function (){
									console.error('Error configuring Sensor ' + service.api);
								}
							);
		        		}
					});
				}
			});
		}
	}
	
	
	function discovery_service_file(){
		webinos.discovery.findServices(new ServiceType("http://webinos.org/api/*"), {
			onFound: function (service) {
				if(service.api.indexOf("file") !== -1){
					if(service.serviceAddress === webinos.session.getPZPId()){
						service.bindService({
							onBind: function () {
								service.requestFileSystem(1, 1024, 
									function (filesystem) {
										root_directory = filesystem.root;
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


	//only for gauges
	var addOnDragStartGauges = function(){

		var gaugesList = $('#gauges_list').children();
		var target = document.getElementById("target");

		gaugesList.each(function() {
		    var id = $(this).prop("id");

		    var elem = document.getElementById(id);
		    
		    elem.ondragstart = function(event) {
				event.dataTransfer.setData("gauges", id);
				target.className = "scroll-overview target"; //indicate droppable area
			}
			elem.ondragend = function(event) {
				target.className = "scroll-overview";
			}

		});
	}
	
	//set onDragStart for all types of boxes
	var addOnDragStart = function(id){

		
		var box = document.getElementById(id);
		box.draggable = true;
		box.ondragstart = function(event) {
			//alert("draggo il grafico");
			event.dataTransfer.setData("boxes", id);
		}
	}

	var addDragEventsForGaugesOnTarget = function(contentDiv){

		var target = document.getElementById("target");

		target.ondragenter = function(event){
			//add class "valid"
			this.className = "scroll-overview valid";
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
			
			//for the position
			var X = event.layerX - $(event.target).position().left;
			var Y = event.layerY - $(event.target).position().top;

			var gauge_selected = event.dataTransfer.getData("gauges");
			if(gauge_selected == "btnGauge"){
				var idChart = "gauge_" + (Object.keys(charts).length + 1);
				var html = "";
	            html += "<div id='main-"+idChart+"' class='chart-container'>";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"' class='chart-titlebar'><div id='name-"+idChart+"' class='chart-sensorname gauge' />";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' class='chart-control delete' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' class='chart-control settings' />";
	            
	            html += "</div>";
	            html+="<canvas class='main' id='drop_canvas-"+idChart+"' width='250' height='250'></canvas></div>";
	            
	            $("#target").prepend(html);
				var chart=new RGraph.Gauge("drop_canvas-"+idChart, min_gauge_range, max_gauge_range, 0);
				var graphic=new Graphic(chart);
				graphic.id=idChart;
				graphic.type="gauge";
				graphic.minRange=min_gauge_range;
				graphic.maxRange=max_gauge_range;
				graphic.coord.x=X;
				graphic.coord.y=Y;
				
	            charts[idChart]=graphic;
	            
				RGraph.Effects.Gauge.Grow(chart);
				
					var d = document.getElementById("main-"+idChart);
		    		d.style.left = graphic.coord.x+'px';
		    		d.style.top = graphic.coord.y+'px';
		    		//addOnDragStart("main-"+idChart);
		    		//var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".main");	//TODO
		            //jsPlumb.draggable(divsWithWindowClass);
		    		
	    		
				enableDragAndDropSensors("drop_canvas-"+idChart);    
				enableButtonsLive(idChart);
			}else if(gauge_selected == "btnTherm"){
				var idChart = "therm_" + (Object.keys(charts).length + 1);
				var html = "";
	            html += "<div id='main-"+idChart+"' class='chart-container therm'>";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"' class='chart-titlebar therm'><div id='name-"+idChart+"' class='chart-sensorname therm' />";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' class='chart-control delete' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' class='chart-control settings' />";
	            
	            html += "</div>";
	            html+="<canvas class='main' id='drop_canvas-"+idChart+"' width='100' height='400'></canvas></div>";
	            $("#target").prepend(html);
				var chart=new RGraph.Thermometer("drop_canvas-"+idChart, min_temperature_range,max_temperature_range,0);
				var graphic=new Graphic(chart);
				graphic.id=idChart;
				graphic.type="thermometer";
				graphic.minRange=min_temperature_range;
				graphic.maxRange=max_temperature_range;
				graphic.coord.x=X;
				graphic.coord.y=Y;
				
	            charts[idChart]=graphic;
	            
				RGraph.Effects.Gauge.Grow(chart);
				
					var d = document.getElementById("main-"+idChart);
		    		d.style.left = graphic.coord.x+'px';
		    		d.style.top = graphic.coord.y+'px';
		    		//addOnDragStart("main-"+idChart);
	    		
				enableDragAndDropSensors("drop_canvas-"+idChart);
				enableButtonsLive(idChart);
			}else if(gauge_selected == "line-chart"){
				var idChart = "chart_" + (Object.keys(charts).length + 1);
	            var html = "";
	            html += "<div id='main-"+idChart+"' class='chart-container line'>";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"' class='chart-titlebar'>";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' class='chart-control delete' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' class='chart-control settings' />";
	            
	            html += "</div>";
	            html += "<div class='' id='drop_div-"+idChart+"'></div>";
	            html += "<div id='chart_div-"+idChart+"' class='line-chart'></div>";
	            html += "</div>";
	            
	            $("#target").prepend(html);
	            var chart_div=document.getElementById('chart_div-'+idChart);
	            var chart=new google.visualization.LineChart(chart_div);
	            var graphic=new Graphic(chart);
	            graphic.id=idChart;
	            graphic.type="line";
	            graphic.coord.x=X;
				graphic.coord.y=Y;
	            graphic.graphData=new google.visualization.DataTable();
	            graphic.graphData.addColumn('string','Data');
	            graphic.graphData.addColumn('number',null);		
	            
				
	    		graphic.options = {
	    				title: '',
	    				chartArea: {width: '90%', height: '75%', top:'25', left: '50'},
	    				legend: {position: 'top'},
	    				titlePosition: 'in', axisTitlesPosition: 'in',
	    				hAxis: {textPosition: 'out'}, vAxis: {textPosition: 'out'},		
	    				colors:['blue','red','orange','green','violet','brown','pink','yellow'],
	    				pointSize: 0
	    				//backgroundColor: ''
	    		      };
	    		
	            charts[idChart]=graphic;
	            graphic.chart.draw(graphic.graphData, graphic.options);
	            
		            var d = document.getElementById("main-"+idChart);
		    		d.style.left = graphic.coord.x+'px';
		    		d.style.top = graphic.coord.y+'px';
		    		//addOnDragStart("main-"+idChart);
	            
	            enableDragAndDropSensors("drop_div-"+idChart);   	//drop over hidden div for line-charts
	            enableButtonsLive(idChart);
	            
			}else{
				alert("Not Allowed!");
			}

			contentDiv.tinyscrollbar_update();

			//stop events fire
			event.stopPropagation();
		};
	};


	var initDragAndDropGauges = function(contentDiv){
		addOnDragStartGauges();
		addDragEventsForGaugesOnTarget(contentDiv);
	};

	//only for sensors
	var addOnDragStartEndSensors = function(ids){
		
		var sensor = document.getElementById(ids);
		sensor.ondragstart = function(event) {
			event.dataTransfer.setData("sensors", sensor.id);
			for(var graphic in charts){
				if(charts[graphic].type=="line")
					$('#drop_div-'+charts[graphic].id).addClass("drop_div");
			}
		};
		sensor.ondragend = function(event) {
			for(var graphic in charts){
				if(charts[graphic].type=="line")
					$('#drop_div-'+charts[graphic].id).removeClass("drop_div");
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
			if(charts[idChart_selected].type!="line")
				this.className = "main_valid";
			else{
				charts[idChart_selected].options['backgroundColor'] = "yellow";
				charts[idChart_selected].chart.draw(charts[idChart_selected].graphData, charts[idChart_selected].options);			}
 		};

 		target.ondragleave = function(event){
 			//remove class "valid"
 			event.stopPropagation();
 			var idChart_selected = event.target.id.split('-')[1];
 			if(charts[idChart_selected].type!="line"){
				this.className = "main";
			}else{
				charts[idChart_selected].options['backgroundColor'] = "";
				charts[idChart_selected].chart.draw(charts[idChart_selected].graphData, charts[idChart_selected].options);
				}
 		};

 		//SENSOR ON CHART
		target.ondrop = function(event){
			
			if(event.preventDefault){
				event.preventDefault();
			}
			//stop events fire
			event.stopPropagation();
			
			var sensor_selected = event.dataTransfer.getData("sensors");
			//this.className = "main";
			
			var idChart_selected = event.target.id.split('-')[1];
			
			var graphic=charts[idChart_selected];
			
			$('#'+idChart_selected).removeClass("drop_div");
			
			if(graphic.type!="line"){
				this.className = "main";
			}else{
				graphic.options['backgroundColor'] = "";
				graphic.chart.draw(graphic.graphData, graphic.options);
			}
				
			if(sensor_selected!=''){
				if(!in_array(sensor_selected,graphic.sensor_list)){
					
					if(!listeners_numbers.hasOwnProperty(sensor_selected)){
						//add event listener
						sensors[sensor_selected].addEventListener('sensor', onSensorEvent, false);
						listeners_numbers[sensor_selected]=0;
					}
					graphic.sensor_active[sensor_selected] = true;
		            listeners_numbers[sensor_selected]++;
		            
		            $('#startstop_cfg_but-'+graphic.id+'-'+sensor_selected).live( 'click',function(event){
			     		 startStopSensor(graphic.id,sensor_selected);
			         });
		            
		            $('#remove_sensor-'+graphic.id+'-'+sensor_selected).live("click",function(){
		            	removeSensor(graphic,sensor_selected);
		    		});
		           
		            if(graphic.type!="line"){
		            	if(graphic.sensor_list[0]!=null){
		            		removeSensor(graphic,graphic.sensor_list[0]);
		            	}
	            		graphic.sensor_list[0]=sensor_selected;		//link new sensor to the gauge
	            		graphic.serviceAddress_list[0]=sensors[sensor_selected].serviceAddress;
	            		$('#name-'+graphic.id).text(sensors[sensor_selected].description);
		            }
					else{
						if(graphic.sensor_list.length==0){
							graphic.graphData.removeColumn(1);
						}
						
						graphic.sensor_list.push(sensor_selected);
						graphic.serviceAddress_list.push(sensors[sensor_selected].serviceAddress);
						graphic.graphData.addColumn('number',sensors[sensor_selected].description);
						
					}
				}
				else
					alert("Not allowed - This sensor is already in this graph");
			}else
				alert("Not allowed");
		};
	};


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
		$('#delete-'+idChart).live( 'click',function(event){
         	deleteChart(this.id.split('-')[1]);
         });

		 $('#settings-'+idChart).live( 'click',function(event){
        	$('#settings-content').empty();
         	$("#settings-container").fadeIn(1000);
        	 for(var elem in charts){
        		 var graphic= charts[elem];
        		 if(graphic.type=="line"){
        			 $("#chart_div-"+graphic.id).fadeOut();
        			 charts_to_fade.push(graphic.id);
        		 }
         	 }
         	
         	var graphic=charts[idChart];
         	for(var sensor in graphic.sensor_list){
         		var html='';
				html+= "<div id='configuration_div-"+graphic.id+"-"+graphic.sensor_list[sensor]+"' class='configuration_div'>";
				html+= "	<div id='remove_sensor-"+graphic.id+"-"+graphic.sensor_list[sensor]+"' class='remove_sensor' >X</div> ";
				html+= "	<div id='sensor_name_config-"+graphic.sensor_list[sensor]+"'>Sensor name: "+sensors[graphic.sensor_list[sensor]].description+"</div>";
				html+= "	<div id='sensor_id_config-"+graphic.sensor_list[sensor]+"'> Sensor id: "+graphic.sensor_list[sensor]+"</div>";
				html+= "	<div id='mode' class='param_td'>Mode";
				html+= "   		<select id='cfg_mode-"+graphic.sensor_list[sensor]+"'>";
				if(sensors_configuration[graphic.sensor_list[sensor]].eventFireMode=='fixedinterval'){
					html+= "    	<option selected value='fixedinterval'>Fixed Interval</option>";
					html+= "    	<option value='valuechange'>Value Change</option>";
				}else{
					html+= "    	<option value='fixedinterval'>Fixed Interval</option>";
					html+= "    	<option selected value='valuechange'>Value Change</option>";
				}
				html+= "   		</select>";
				if(graphic.sensor_active[graphic.sensor_list[sensor]]==true){
					html+=" 	<input type='button' id='startstop_cfg_but-"+graphic.id+"-"+graphic.sensor_list[sensor]+"' value='Stop'>";
				}else{
					html+=" 	<input type='button' id='startstop_cfg_but-"+graphic.id+"-"+graphic.sensor_list[sensor]+"' value='Start'>";
				}
				html+= "	</div>";
				html+= "	<div id='rate' > Rate <input type='text' id='cfg_rate-"+graphic.sensor_list[sensor]+"' class='cfg_element' value='"+sensors_configuration[graphic.sensor_list[sensor]].rate+"' ></div>";
				html+= "	<div id='timeout'> Timeout <input type='text' id='cfg_timeout-"+graphic.sensor_list[sensor]+"' class='cfg_element' value='"+sensors_configuration[graphic.sensor_list[sensor]].time+"'></div>";
				if(graphic.type!='line'){
					html+= "	<div id='range'> Range:		Min <input type='text' id='min_range-"+graphic.sensor_list[sensor]+"' value='"+graphic.minRange+"'>		Max <input type='text' id='max_range-"+graphic.sensor_list[sensor]+"' value='"+graphic.maxRange+"'></div>";
				}else{
					html+= "	<div id='color' class='param_td'>Color";
					html+= "   		<select id='cfg_color-"+graphic.sensor_list[sensor]+"'>";
					for(var i=0;i<graphic.options.colors.length;i++){
						if(lineColor[i]==graphic.options.colors[sensor]){
							html+= "    	<option selected value='"+lineColor[i]+"'>"+lineColor[i]+"</option>";
						}
						else{
							html+= "    	<option value='"+lineColor[i]+"'>"+lineColor[i]+"</option>";
						}
					}
					html+= "   		</select>";	
				}
				html+= "</div>";
				$('#settings-content').append(html);
         	}
         	html= "	<div id='save_cfg_but-"+idChart+"' class='save_cfg_but'> <input class='button' type='button' value='Save'></div>";
         	$('#settings-content').append(html);
         	
         });
		 
		 //SAVE BUTTON
         $('#save_cfg_but-'+idChart).live( 'click',function(event){
     		var graphic=charts[idChart];
     		var color=[];
          	for(var sensor in graphic.sensor_list){
          		var urate = $("#cfg_rate-"+graphic.sensor_list[sensor]).val();
     			var utime = $("#cfg_timeout-"+graphic.sensor_list[sensor]).val();
     			var umode = $("#cfg_mode-"+graphic.sensor_list[sensor]).val();
     			graphic.minRange=$("#min_range-"+graphic.sensor_list[sensor]).val();
     			graphic.maxRange=$("#max_range-"+graphic.sensor_list[sensor]).val();
     			if(graphic.type=='gauge'){
     				$("#drop_canvas-"+idChart).empty();
     				var chart=new RGraph.Gauge("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
     				graphic.chart=chart;
     			}else if(graphic.type=='thermometer'){
     				$("#drop_canvas-"+idChart).empty();
     				var chart=new RGraph.Thermometer("drop_canvas-"+idChart, parseInt(graphic.minRange), parseInt(graphic.maxRange), 0);
     				graphic.chart=chart;
     			}
     			else{
     				color[sensor]=$("#cfg_color-"+graphic.sensor_list[sensor]).val();
         			graphic.options.colors[sensor]=color[sensor];
     			}
     			sensors_configuration[graphic.sensor_list[sensor]]={
    					rate:urate,
    					time:utime,
    					eventFireMode:umode
    			};
          		sensors[graphic.sensor_list[sensor]].configureSensor({rate: urate, time: utime, eventFireMode: umode}, 
     					function(){
     					},
     					function (){
     						console.error('Error configuring Sensor ' + service.api);
     					}
     				);
          	}
          	fadeOutSettings();
      	 });
              
	}
	


	function deleteChart(idChart_selected){
		var graphic= charts[idChart_selected];
		for(var sens in graphic.sensor_list){
			$('#startstop_cfg_but-'+graphic.id+'-'+graphic.sensor_list[sens]).die();
			if((listeners_numbers.hasOwnProperty(graphic.sensor_list[sens]))&&(graphic.sensor_active[graphic.sensor_list[sens]])){	//if sensor is inactive, the listener is already removed
				listeners_numbers[graphic.sensor_list[sens]]--;
				if(listeners_numbers[graphic.sensor_list[sens]]==0){
					sensors[graphic.sensor_list[sens]].removeEventListener('sensor', onSensorEvent, false);
					delete listeners_numbers[graphic.sensor_list[sens]];
				}		
			}
		}
		delete charts[idChart_selected];
		$("#main-"+idChart_selected).remove();
		$('#delete-'+idChart_selected).die();
		$('#settings-'+idChart_selected).die();
	}
	
	function removeSensor(graphic, sid){
		listeners_numbers[sid]--;
		delete graphic.sensor_active[sid];
		
		if(graphic.type=='line'){
			graphic.graphData.removeColumn(graphic.sensor_list.indexOf(sid)+1);
			graphic.sensor_list.splice(graphic.sensor_list.indexOf(sid),1);
			if(graphic.sensor_list.length==0){
				graphic.graphData.addColumn('number',null);		//add a null column only for a graphical aspect
			}
		}else{
			graphic.sensor_list=[];
			$('#name-'+graphic.id).empty();
		}
		
		if(listeners_numbers[sid]==0){
			sensors[sid].removeEventListener('sensor', onSensorEvent, false);
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
				sensors[sid].removeEventListener('sensor', onSensorEvent, false);
				delete listeners_numbers[sid];
			}	
		}else{	//active the sensor listening
			charts[chartId].sensor_active[sid] = true;
			$('#startstop_cfg_but-'+chartId+'-'+sid).prop('value','Stop');
			
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
//})();
