(function(){
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

	var sensors = {};
	var sensors_configuration = {};
	var sensor_chart = {};
	var sensorActive = {};
	var listeners = new Array();


	var onSensorEvent = function(event){
		var sensor = sensors && sensors[event.sensorId];
		if (sensor) {
			if (!sensor.values) {
				sensor.values = [];
			}
			var date = new Date(event.timestamp);
			var item = {
				value: event.sensorValues[0] || 0,
				timestamp: event.timestamp,
				unit: event.unit,
				time: Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', event.timestamp)
			};
			sensor.values.push(item);

			console.log("************ SENSOR VALURE: " + item.value);


			var series = sensor_chart[sensor.id].get('values');
			series.addPoint({x: item.timestamp,y: item.value},true,series.data.length>10,true);

			
		}
	};

	jQuery(document).ready(function() {

		$("#sensor_id_config").hide();

		$('#refresh').live( 'click',function(event){
			discovery_sensors();
		});

		$('#cfg_but').live( 'click',function(event){
			var sid = $("#sensor_id_config").text();
			var urate = $("#cfg_rate").val();
			var umode = $("#cfg_mode").val();
			var utime = $("#cfg_timeout").val();

			if(sid!="" && umode!=""){
				sensors[sid].configureSensor({rate: urate, time: utime, eventFireMode: umode}, 
					function(){
					},
					function (){
						console.error('Error configuring Sensor ' + service.api);
					}
				);
			}
			else
				alert("Error! Can you select a sensor and a modality?");
        });

		discovery_sensors();
	});

	function discovery_sensors(){
		jQuery("#sensors_table").empty();
		for ( var i in sensor_types) {
			var type = sensor_types[i];
			webinos.discovery.findServices(new ServiceType(type), {
				onFound: function (service) {
					sensors[service.id] = service;
					sensorActive[service.id] = false;
					service.bind({
						onBind:function(){
		        			console.log("Service "+service.api+" bound");
		        			console.log(service);
		        			service.configureSensor({rate: 500, eventFireMode: "fixedinterval"}, 
		        				function(){
		        					var sensor = service;

                                    var sensorCode = '<tr><td><img width="120px" height="120px" src="./assets/images/'+icons[sensor.api]+'" id="'+sensor.id+'" /></td></tr><tr><th>'+sensor.description+'</th></tr>';
                                    jQuery("#sensors_table").append(sensorCode);

									initDragAndDrop(sensor.id);

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


	//set onDragStart for all types of boxes
	var addOnDragStart = function(ids){

		var sensor = document.getElementById(ids);

		sensor.ondragstart = function(event) {
			event.dataTransfer.setData("sensors", sensor.id);
		}
	}

	var addDragEventsForTarget = function(){

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

			//remove class "valid"
			this.className = "";

			var sensor_selected = event.dataTransfer.getData("sensors");
	
			//disable drag andr drop of element selected
			document.getElementById(sensor_selected).draggable = false;

			//set title of box configuration
			settingSensor(sensor_selected);

			//add event listener
			sensors[sensor_selected].addEventListener('sensor', onSensorEvent, false);
            sensorActive[sensor_selected] = true;

            var html = "";
            html += "<div class='main' id='main-"+sensor_selected+"' >";
            html += "<div id='info-"+sensor_selected+"'>";
            html += "<input type='image' id='delete-"+sensor_selected+"' src='assets/delete_min.png' alt='delete' style='float:right; padding:5px 5px 5px 5px;' />";
			html += "<input type='image' id='settings-"+sensor_selected+"' src='assets/sett_min.png' alt='settings' style='float:right; padding:5px 5px 5px 5px;' />";
            html += "<input type='button' id='start-"+sensor_selected+"' value='Stop' style='float:right; padding:5px 5px 5px 5px;' />";
            html += "</div>";
            html += "<div id='sensor-chart-"+sensor_selected+"' style='height: 300px; width: 90%; margin: 0 auto;'></div>";
            html += "</div>";

            $("#target").append(html);

            if(listeners.indexOf(sensor_selected) == -1){
	            $('#delete-'+sensor_selected).live( 'click',function(event){
	            	deleteChart(this.id.split('-')[1]);
	            });

	            $('#settings-'+sensor_selected).live( 'click',function(event){
	            	settingSensor(this.id.split('-')[1]);
	            });

	            $('#start-'+sensor_selected).live( 'click',function(event){
	            	startStopSensor(this.id.split('-')[1]);
	            });
	            listeners.push(sensor_selected);
        	}
            
            
            Highcharts.setOptions({
	            global: {
	                useUTC: false
	            }
	        });
			sensor_chart[sensor_selected] = new Highcharts.Chart({
				chart: {
					renderTo: 'sensor-chart-'+sensor_selected,
					type: 'area',
					marginRight: 10
				},
				xAxis: {
					type: 'datetime',
					tickPixelInterval: 150
				},
				yAxis: {
					title: {
						text: ' '
					},
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}]
				},
				title: {
					style:{
						width:'360px',
						fontSize:'12px'
					},
		            text: sensors[sensor_selected].description
		        },
				tooltip: {
					formatter: function() {
						return '<b>'+ this.series.name +'</b><br/>'+Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +'<br/>'+Highcharts.numberFormat(this.y, 2);
					}
				},
				legend: {
					enabled: false
				},
				exporting: {
					enabled: false
				},
				series: [{
					id: 'values',
					name: 'values',
					data: []
				}]
			});
		}
	}

	var initDragAndDrop = function(ids){
		addOnDragStart(ids);
		addDragEventsForTarget();
	}


	function deleteChart(sid){

		//enable drag and drop of element removed
		document.getElementById(sid).draggable = true;

		//stop event listener
		sensors[sid].removeEventListener('sensor', onSensorEvent, false);
        sensorActive[sid] = false;
        
		$("#main-"+sid).remove();

		$("#sensor_selected_th").empty();
		$("#sensor_id_config").empty();
	}

	function settingSensor(sid){
		$("#sensor_selected_th").empty();
		$("#sensor_selected_th").text("Configuration of " + sensors[sid].description);
		$("#sensor_id_config").empty();
		$("#sensor_id_config").text(sid);
	}

	function startStopSensor(sid){
		if(sensorActive[sid] == true){
			sensorActive[sid] = false;
			$('#start-'+sid).prop('value','Start');
			sensors[sid].removeEventListener('sensor', onSensorEvent, false);
		}else{
			sensorActive[sid] = true;
			$('#start-'+sid).prop('value','Stop');
			sensors[sid].addEventListener('sensor', onSensorEvent, false);
		}
		
	}


})();
