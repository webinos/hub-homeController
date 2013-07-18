(function(){

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
	var sensors_configuration = {};
	var sensor_chart = {};
	var sensorActive = {};
	var listeners = new Array();

	var gauge_charts = {};			//To delete
	var gauge_sensor_list = {};

	var listeners_numbers={}	//for counting the number of listeners per sensor

	var charts={};
	var labels_value=[];
	var chart_selected;
	var charts_to_fade=[];

 	function Graphic(chart){
 			this.id;
 			this.chart = chart;
 			this.sensor_list=[];
 			this.values=[];
 			this.old_values=[];
 			this.graphData =[];
 			this.numberOfValues=0;
 			this.title;
 			this.type;
 			this.options;
 			this.getInfo = function() {
 		        return "getInfo";
 		    };
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

				if(in_array(sensor.id,graphic.sensor_list)){
					if(graphic.type=="thermometer"){
						graphic.chart.value = value;
						RGraph.Effects.Thermometer.Grow(graphic.chart);
					}else if(graphic.type=="gauge"){
						graphic.chart.value = value;
						RGraph.Effects.Gauge.Grow(graphic.chart);
					}else if(graphic.type=="line"){
						var index=graphic.sensor_list.indexOf(sensor.id);

						graphic.values.push(time);

						for(var i=0;i<graphic.sensor_list.length;i++){
							if(i==index)
								graphic.values.push(value);
							else
								graphic.values.push(graphic.old_values[i+1]);
						}
						graphic.numberOfValues++;
						graphic.graphData.addRow(graphic.values);
				  		graphic.chart.draw(graphic.graphData, graphic.options);
				  		graphic.old_values=graphic.values;

						if(graphic.numberOfValues>150)
							graphic.graphData.removeRow(0);
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

		$('#save_cfg_but').live( 'click',function(event){
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

		var leftColumn = $('#leftcolumn');
		leftColumn.tinyscrollbar();

        var rightColumn = $('#rightcolumn');
        rightColumn.tinyscrollbar();

        var contentDiv = $('#content');
        contentDiv.tinyscrollbar();

		discovery_sensors(leftColumn);

		$(window).resize(function() {
            leftColumn.tinyscrollbar_update();
            contentDiv.tinyscrollbar_update();
            rightColumn.tinyscrollbar_update();
        });

		initDragAndDropGauges(contentDiv);

		var popup = $("#settings-container");
		popup.click(function(){
			popup.fadeOut();
			for(chart_id in charts_to_fade){
				$("#chart_div-"+charts_to_fade[chart_id]).fadeIn();
		  	}
		});

		$("#close").click(function(){
		 	popup.fadeOut();
		 	for(chart_id in charts_to_fade){
				//alert("aa: "+chars_to_fade[chart_id]);
				$("#chart_div-"+charts_to_fade[chart_id]).fadeIn();
		  	}
		});

	});

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
					sensorActive[service.id] = false;
					service.bind({
						onBind:function(){
		        			console.log("Service "+service.api+" bound");
		        			console.log(service);
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

			//remove class "valid"
			this.className = "scroll-overview";

			var gauge_selected = event.dataTransfer.getData("gauges");
			if(gauge_selected == "btnGauge"){
				var idChart = "gauge_" + (Object.keys(charts).length + 1);
				var html = "";
	            html += "<div id='main-"+idChart+"' class='chart-container'>";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"' class='chart-titlebar'><div id='name-"+idChart+"' class='chart-sensorname gauge' />";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' class='chart-control delete' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' class='chart-control settings' />";
	            //html += "<input type='button' id='start-"+idChart+"' value='Stop' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "</div>";
	            html+="<canvas class='main' id='drop_canvas-"+idChart+"' width='250' height='250'></canvas></div>";
	            $("#target").prepend(html);
				var chart=new RGraph.Gauge("drop_canvas-"+idChart, -10, 65, 0);
				var g=new Graphic(chart);
	            g.id=idChart;
	            g.type="gauge";
	            charts[idChart]=g;

				RGraph.Effects.Gauge.Grow(chart);
				enableDragAndDropSensors("drop_canvas-"+idChart);
				enableButtonsLive(idChart);
			}else if(gauge_selected == "btnTherm"){
				var idChart = "therm_" + (Object.keys(charts).length + 1);
				//alert("id_gauge: "+idChart);
				var html = "";
	            html += "<div id='main-"+idChart+"' class='chart-container therm'>";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"' class='chart-titlebar therm'><div id='name-"+idChart+"' class='chart-sensorname therm' />";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' class='chart-control delete' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' class='chart-control settings' />";
	            //html += "<input type='button' id='start-"+idChart+"' value='Stop' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "</div>";
	            html+="<canvas class='main' id='drop_canvas-"+idChart+"' width='100' height='400'></canvas></div>";
	            $("#target").prepend(html);
				var chart=new RGraph.Thermometer("drop_canvas-"+idChart, -30,80,0);
				var g=new Graphic(chart);
	            g.id=idChart;
	            g.type="thermometer";
	            charts[idChart]=g;

				RGraph.Effects.Gauge.Grow(chart);
				enableDragAndDropSensors("drop_canvas-"+idChart);
				enableButtonsLive(idChart);
			}else if(gauge_selected == "line-chart"){
				var idChart = "chart_" + (Object.keys(charts).length + 1);
				//alert("id_gauge: "+idChart);
				//var idChart = "line-chart_" + (Object.keys(gauge_charts).length + 1);
				//$('#target').append("<div id='div_"+idChart+"' class='' ><canvas class='main' id='"+idChart+"' height='250' width='300'></canvas></div>");
				//$('#target').append("<canvas class='main' id='"+idChart+"'height='250' width='550' ></canvas>");
	            var html = "";
	            html += "<div id='main-"+idChart+"' class='chart-container line'>";	//this div is used for deleting all the elements of this chart when delete button is clicked
	            html += "<div id='info-"+idChart+"' class='chart-titlebar'>";
	            html += "<input type='image' id='delete-"+idChart+"' src='assets/delete_min.png' alt='delete' class='chart-control delete' />";
	            html += "<input type='image' id='settings-"+idChart+"' src='assets/sett_min.png' alt='settings' class='chart-control settings' />";
	            //html += "<input type='button' id='start-"+idChart+"' value='Stop' style='float:right; padding:5px 5px 5px 5px;' />";
	            html += "</div>";
	            html += "<div class='' id='drop_div-"+idChart+"'></div>";
	            html += "<div id='chart_div-"+idChart+"' class='line-chart'></div>";
	            html += "</div>";

	            $("#target").prepend(html);
	            var chart_div=document.getElementById('chart_div-'+idChart);
	            var chart=new google.visualization.LineChart(chart_div);
//	            var dataset1 = [11,9,7,6,6,7,9,9,7,6,6,7,9,11];

	            //var chart=new RGraph.Line(idChart, []);		//empty graph
	            var graphic=new Graphic(chart);
	            //g.sensor_list.push(sensor_selected);
	            graphic.id=idChart;
	            graphic.type="line";
	            graphic.graphData=new google.visualization.DataTable();
	            graphic.graphData.addColumn('string','Data');
	            graphic.graphData.addColumn('number',null);		//creo una nuova colonna per il nuovo sensore nei valori del grafico

	    		graphic.options = {
	    		        title: ''
	    		      };

	            charts[idChart]=graphic;
	            graphic.chart.draw(graphic.graphData, graphic.options);


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
			var idGauge_selected = event.target.id.split('-')[1];
			if(charts[idGauge_selected].type!="line") {
				this.className = "main valid";
			} else {
				charts[idGauge_selected].options = {
    		        title: '',
    		        backgroundColor: 'yellow'
    		      };
				charts[idGauge_selected].chart.draw(charts[idGauge_selected].graphData, charts[idGauge_selected].options);
			}
 		};

 		target.ondragleave = function(event){
 			//remove class "valid"
 			event.stopPropagation();
 			var idGauge_selected = event.target.id.split('-')[1];
 			if(charts[idGauge_selected].type!="line") {
				this.className = "main";
			} else {
				charts[idGauge_selected].options = {
	    		        title: ''
	    		      };
				charts[idGauge_selected].chart.draw(charts[idGauge_selected].graphData, charts[idGauge_selected].options);
			}
			//$('#drop_div'+idGauge_selected).className="";
 			//this.className = "main";
 		};

 		//SENSOR ON GAUGE
		target.ondrop = function(event){

			//stop events fire
			event.stopPropagation();

			var sensor_selected = event.dataTransfer.getData("sensors");
			//this.className = "main";

			var idGauge_selected = event.target.id.split('-')[1];

			var graphic=charts[idGauge_selected];

			$('#'+idGauge_selected).removeClass("drop_div");

			if(graphic.type!="line"){
				this.className = "main";
			}else{
				graphic.options = {
	    		        title: ''
	    		      };
				graphic.chart.draw(graphic.graphData, graphic.options);
			}

			if(sensor_selected!=''){
				//set title of box configuration
				settingSensor(sensor_selected);

				if(!listeners_numbers.hasOwnProperty(sensor_selected)){
					//add event listener
					sensors[sensor_selected].addEventListener('sensor', onSensorEvent, false);
		            sensorActive[sensor_selected] = true;
		            listeners_numbers[sensor_selected]=0;
				}

				//TODO do not increment listener_number if the user drags the same sensor on the same graph
	            listeners_numbers[sensor_selected]++;

	            if(graphic.type!="line"){
	            	if(graphic.sensor_list[0]!=null){
	            		listeners_numbers[graphic.sensor_list[0]]--;
						if(listeners_numbers[graphic.sensor_list[0]]==0){
							sensors[graphic.sensor_list[0]].removeEventListener('sensor', onSensorEvent, false);
							sensorActive[graphic.sensor_list[0]] = false;
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
					if(graphic.sensor_list.length==0)
						graphic.graphData.removeColumn(1);

					graphic.sensor_list.push(sensor_selected);
					graphic.graphData.addColumn('number',sensors[sensor_selected].description);

				}


				graphic.title=sensors[sensor_selected].description;		//TODO add sensor's description
			}
			else
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
         	for(sensor in graphic.sensor_list){
	         	var html='';
				html+= "<div id='configuration_div' class='configuration_div'>";
				html+= "	<div id='sensor_id_config'> Sensor id: "+graphic.sensor_list[sensor]+"</div>";
				html+= "	<div id='sensor_selected_th'> </div>";
				html+= "	<div id='mode' class='param_td'>Mode";
				html+= "   	<select id='cfg_mode'>";
				html+= "       	<option value=''>Choose mode</option>";
				html+= "           <option value='fixedinterval'>Fixed Interval</option>";
				html+= "           <option value='valuechange'>Value Change</option>";
				html+= "   	</select>";
				html+= "		<input type='button' id='cfg_startstop_but' value='Start'>";
				html+= "	</div>";
				html+= "	<div id='rate' > Rate <input type='text' id='cfg_rate' class='cfg_element'></div>";
				html+= "	<div id='timeout'> Timeout <input type='text' id='cfg_timeout' class='cfg_element'></div>";
				html+= "	<input class='button_td' type='button' id='save_cfg_but' value='Save'>";
				html+= "   </div>";
				$('#settings-content').append(html);
         	}

         });
	}

	function deleteChart(idGauge_selected){
		//alert(" delete graphic: main-"+idGauge_selected);

		for(var elem in charts){
			var graphic= charts[elem];
			if(graphic.id==idGauge_selected){
				for(var sens in graphic.sensor_list){
					listeners_numbers[graphic.sensor_list[sens]]--;
					if(listeners_numbers[graphic.sensor_list[sens]]==0){
						sensors[graphic.sensor_list[sens]].removeEventListener('sensor', onSensorEvent, false);
						sensorActive[graphic.sensor_list[sens]] = false;
						delete listeners_numbers[graphic.sensor_list[sens]];
					}
				}
				graphic.sensor_list=[];
			}
		}

		$("#main-"+idGauge_selected).remove();
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

	function in_array(val, reference_array) {
	    for(i = 0; i < reference_array.length; i++) {
		if(val == reference_array[i]) {
		    return true;
		}
	    }
	    return false;
	}
})();
