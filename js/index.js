(function(){

	/*function Gauge(id, type, gauge){
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
	}*/

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
	
	var charts={};				//contain Graphic instances
	var chart_selected;
	var charts_to_fade=[];
	
	var min_temperature_range=-30;
	var max_temperature_range=50;
	
	var min_gauge_range=-10;
	var max_gauge_range=65;
	var lineColor=['blue','red','orange','green','violet','brown','pink','yellow'];
	
	
 	function Graphic(chart){
 			this.id='';
 			this.chart = chart;
 			this.sensor_list=[];
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
			discovery_sensors();
		});
		
		discovery_sensors();

		initDragAndDropGauges();
		$("#hover").click(function(){
			fadeOutSettings();  
		});

		$("#close").click(function(){
			fadeOutSettings();
		});
	});
	
	function fadeOutSettings(){
		$("#settings_div").fadeOut();
		for(chart_id in charts_to_fade){
			$("#chart_div-"+charts_to_fade[chart_id]).fadeIn();
			charts[charts_to_fade[chart_id]].chart.draw(charts[charts_to_fade[chart_id]].graphData, charts[charts_to_fade[chart_id]].options);
	  	}	  
		charts_to_fade=[];
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

	function discovery_sensors(){
		jQuery("#sensors_table").empty();

		for ( var i in sensor_types) {
			var type = sensor_types[i];
			webinos.discovery.findServices(new ServiceType(type), {
				onFound: function (service) {
					sensors[service.id] = service;
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

                                    var sensorCode = '<tr><td><img width="120px" height="120px" src="./assets/images/'+icons[sensor.api]+'" id="'+sensor.id+'" draggable="false" /></td></tr><tr><th>'+sensor.description+'</th></tr>';
                                    jQuery("#sensors_table").append(sensorCode);

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


	//only for gauges
	var addOnDragStartGauges = function(){

		var gaugesList = $('#gauges_list').children();

		gaugesList.each(function() {
		    var id = $(this).prop("id");

		    var elem = document.getElementById(id);
		    
		    elem.ondragstart = function(event) {
				event.dataTransfer.setData("gauges", id);
			}

		});
	}

	var addDragEventsForGaugesOnTarget = function(){

		var target = document.getElementById("target");

		target.ondragenter = function(event){
			//add class "valid"
			this.className = "valid";
		}

		target.ondragleave = function(event){
			//remove class "valid"
			this.className = "";
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
			this.className = "";

			var gauge_selected = event.dataTransfer.getData("gauges");
			if(gauge_selected == "btnGauge"){
				var idChart = "gauge_" + (Object.keys(charts).length + 1);
				var html = "";
	            html += "<div id='main-"+idChart+"'>";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"'><div id='name-"+idChart+"' style='font-size:16px;'/>";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "</div>";
	            html+="<canvas class='main' id='drop_canvas-"+idChart+"' width='250' height='250'></canvas></div>";
	            $("#drophere").after(html);
				var chart=new RGraph.Gauge("drop_canvas-"+idChart, min_gauge_range, max_gauge_range, 0);
				var graphic=new Graphic(chart);
				graphic.id=idChart;
				graphic.type="gauge";
				graphic.minRange=min_gauge_range;
				graphic.maxRange=max_gauge_range;
	            charts[idChart]=graphic;
	            
				RGraph.Effects.Gauge.Grow(chart);
				enableDragAndDropSensors("drop_canvas-"+idChart);    
				enableButtonsLive(idChart);
			}else if(gauge_selected == "btnTherm"){
				var idChart = "therm_" + (Object.keys(charts).length + 1);
				var html = "";
	            html += "<div id='main-"+idChart+"'>";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"'><div id='name-"+idChart+"' style='font-size:16px;'/>";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "</div>";
	            html+="<canvas class='main' id='drop_canvas-"+idChart+"' width='100' height='400'></canvas></div>";
	            $("#drophere").after(html);
				var chart=new RGraph.Thermometer("drop_canvas-"+idChart, min_temperature_range,max_temperature_range,0);
				var graphic=new Graphic(chart);
				graphic.id=idChart;
				graphic.type="thermometer";
				graphic.minRange=min_temperature_range;
				graphic.maxRange=max_temperature_range;
	            charts[idChart]=graphic;
	            
				RGraph.Effects.Gauge.Grow(chart);
				enableDragAndDropSensors("drop_canvas-"+idChart);
				enableButtonsLive(idChart);
			}else if(gauge_selected == "line-chart"){
				var idChart = "chart_" + (Object.keys(charts).length + 1);
	            var html = "";
	            html += "<div class='main' id='main-"+idChart+"' >";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"'>";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "</div>";
	            html += "<div class='' id='drop_div-"+idChart+"'></div>";
	            html += "<div id='chart_div-"+idChart+"'style='height: 450px; width: 610px; top: 40px; margin: 0 auto; z-index:2;'></div>";
	            html += "</div>";
	            
	            $("#drophere").after(html);
	            var chart_div=document.getElementById('chart_div-'+idChart);
	            var chart=new google.visualization.LineChart(chart_div);
	            var graphic=new Graphic(chart);
	            graphic.id=idChart;
	            graphic.type="line";
	            graphic.graphData=new google.visualization.DataTable();
	            graphic.graphData.addColumn('string','Data');
	            graphic.graphData.addColumn('number',null);		
	            
				graphic.title="title";
	    		graphic.options = {
	    				chartArea: {width: '90%', height: '75%', top:'25'},
	    				legend: {position: 'top'},
	    				titlePosition: 'in', axisTitlesPosition: 'in',
	    				hAxis: {textPosition: 'out'}, vAxis: {textPosition: 'out'},		
	    				colors:['blue','red','orange','green','violet','brown','pink','yellow'],
	    				pointSize: 0
	    		      };
	    		
	            charts[idChart]=graphic;
	            graphic.chart.draw(graphic.graphData, graphic.options);
	            
	            
	            enableDragAndDropSensors("drop_div-"+idChart);   	//drop over hidden div for line-charts
	            enableButtonsLive(idChart);
			}else{
				alert("Not Allowed!");
			}

			//stop events fire
			event.stopPropagation();
		};
	};


	var initDragAndDropGauges = function(){
		addOnDragStartGauges();
		addDragEventsForGaugesOnTarget();
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
		            
		            $('#startstop_cfg_but-'+graphic.id+'_'+sensor_selected).live( 'click',function(event){
			     		 startStopSensor(graphic.id,sensor_selected);
			         });
		            
		            $('#remove_sensor-'+graphic.id+'_'+sensor_selected).live("click",function(){
		            	removeSensor(graphic,sensor_selected);
		    		});
		           
		            if(graphic.type!="line"){
		            	if(graphic.sensor_list[0]!=null){
		            		listeners_numbers[graphic.sensor_list[0]]--;
							if(listeners_numbers[graphic.sensor_list[0]]==0){
								sensors[graphic.sensor_list[0]].removeEventListener('sensor', onSensorEvent, false);
								graphic.sensor_active[graphic.sensor_list[0]] = false;
								//sensorActive[graphic.sensor_list[0]] = false;
								delete listeners_numbers[graphic.sensor_list[0]];
								graphic.sensor_list[0]=sensor_selected;
								$('#name-'+graphic.id).empty();
			            		$('#name-'+graphic.id).text(sensors[sensor_selected].description);
							}else{
								graphic.sensor_list[0]=sensor_selected;
								$('#name-'+graphic.id).empty();
			            		$('#name-'+graphic.id).text(sensors[sensor_selected].description);
							}
		            	}else{
		            		graphic.sensor_list[0]=sensor_selected;
		            		$('#name-'+graphic.id).empty();
		            		$('#name-'+graphic.id).text(sensors[sensor_selected].description);
		            	}
		            }
					else{
						if(graphic.sensor_list.length==0){
							graphic.graphData.removeColumn(1);
						}
						
						graphic.sensor_list.push(sensor_selected);
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
        	 $('#popup').empty();
        	 $("#settings_div").fadeIn(1000);
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
				html+= "<div id='configuration_div-"+graphic.id+"_"+graphic.sensor_list[sensor]+"' class='configuration_div'>";
				html+= "	<div id='remove_sensor-"+graphic.id+"_"+graphic.sensor_list[sensor]+"' class='remove_sensor' >X</div> ";
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
					html+=" 	<input type='button' id='startstop_cfg_but-"+graphic.id+"_"+graphic.sensor_list[sensor]+"' value='Stop'>";
				}else{
					html+=" 	<input type='button' id='startstop_cfg_but-"+graphic.id+"_"+graphic.sensor_list[sensor]+"' value='Start'>";
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
				$('#popup').append(html);	
         	}
         	html= "	<div id='save_cfg_but-"+idChart+"' class='save_cfg_but'> <input class='button' type='button' value='Save'></div>";
         	$('#popup').append(html);
         	
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
     			}else{
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
				if(listeners_numbers.hasOwnProperty(graphic.sensor_list[sens])){
					listeners_numbers[graphic.sensor_list[sens]]--;
					if(listeners_numbers[graphic.sensor_list[sens]]==0){
						sensors[graphic.sensor_list[sens]].removeEventListener('sensor', onSensorEvent, false);
						graphic.sensor_active[graphic.sensor_list[sens]]=false;
						//TODO remove all the graphic instance
						delete listeners_numbers[graphic.sensor_list[sens]];
					}		
				}
			}
		graphic.sensor_list=[];	//to remove and delete the object 'graphic' at all
        
		$("#main-"+idChart_selected).remove();
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
		
		$("#configuration_div-"+graphic.id+"_"+sid).remove();
		$('#remove_sensor-'+graphic.id+'_'+sid).die();		
	}

	
	function startStopSensor(chartId,sid){
		if(charts[chartId].sensor_active[sid] == true){	//stop the sensor listening
			$('#startstop_cfg_but-'+chartId+'_'+sid).prop('value','Start');
			charts[chartId].sensor_active[sid] = false;
			listeners_numbers[sid]--;
			if(listeners_numbers[sid]==0){
				sensors[sid].removeEventListener('sensor', onSensorEvent, false);
				delete listeners_numbers[sid];
			}	
		}else{	//active the sensor listening
			charts[chartId].sensor_active[sid] = true;
			$('#startstop_cfg_but-'+chartId+'_'+sid).prop('value','Stop');
			
			if(!listeners_numbers.hasOwnProperty(sid)){
				//add event listener
				sensors[sid].addEventListener('sensor', onSensorEvent, false);
				charts[chartId].sensor_active[sid]=true; 
	            listeners_numbers[sid]=0;
			}
            listeners_numbers[sid]++;
		}
		
		charts[chartId].sensor_list
		
	}
	
	function in_array(val, reference_array) {
	    for(i = 0; i < reference_array.length; i++) {
		if(val == reference_array[i]) {
		    return true;
		}
	    }
	    return false;
	}
})();
