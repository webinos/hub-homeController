var root_directory = {};

var file_name_for_graphics = "hub_charts.txt";

function save_file(data, file_name){
	root_directory.getFile(file_name, {create: true, exclusive: false}, 
		function (entry) {
			entry.createWriter(
				function (writer) {
					var written = false;
					writer.onerror = function (evt) {
						alert("Error writing file (#" + evt.target.error.name + ")");
					}

					writer.onwrite = function (evt) {
						if (!written) {
							written = true;
							writer.write(new Blob([JSON.stringify(data)]));
						}
					}
					
					writer.truncate(0);
				}, 
				function (error){
					alert("Error retrieving file writer (#" + error.name + ")");
				}
			);
		},
		function (error) {
			alert(error.message);
		}
	);
}

function load_file(file_name){
	var conf = confirm("Do you want to continue loading?");

	if(conf){
	    root_directory.getFile(file_name, {create: true, exclusive: false}, 
			function (myentry) {
				var r = new window.FileReader();
				r.onerror = function (evt) {
					alert("Error reading file (#" + evt.target.error.name + ")");
				}

				r.onload = function (evt) {
					try{
						var contents = JSON.parse(evt.target.result);

						//for graphic file
						if(file_name == file_name_for_graphics){
							//remove all actual elements inside the target
							clearAll_for_graphics();

							
							//Create the graphics
							for(var i in contents){
								var g=contents[i];
								var idChart=g.id;
								if(g.type=="line"){
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
						            graphic.id=g.id;
						            graphic.sensor_list=g.sensor_list;
						            graphic.title=g.title;
						            graphic.type=g.type;
						            graphic.options = g.options;
						            graphic.sensor_active=g.sensor_active;
						            graphic.serviceAddress_list=g.sA_list;
						            graphic.minRange=g.minRange;
						            graphic.maxRange=g.maxRange;
						            graphic.coord.x=g.coord.x;
									graphic.coord.y=g.coord.y;
						            graphic.graphData=new google.visualization.DataTable();
						            graphic.graphData.addColumn('string','Data');
						            graphic.graphData.addColumn('number',null);		
						            charts[idChart]=graphic;
						            graphic.chart.draw(graphic.graphData, graphic.options);
						            enableDragAndDropSensors("drop_div-"+idChart);   	//drop over hidden div for line-charts
								}else if(g.type=="gauge"){
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
									graphic.id=g.id;
						            graphic.sensor_list=g.sensor_list;
						            graphic.serviceAddress_list=g.sA_list;
						            graphic.title=g.title;
						            graphic.type=g.type;
						            graphic.sensor_active=g.sensor_active;
						            graphic.minRange=g.minRange;
						            graphic.maxRange=g.maxRange;
						            graphic.coord.x=g.coord.x;
									graphic.coord.y=g.coord.y;
						            charts[idChart]=graphic;
						            RGraph.Effects.Gauge.Grow(chart);
						            enableDragAndDropSensors("drop_canvas-"+idChart);
								}else if(g.type=="thermometer"){
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
									graphic.id=g.id;
						            graphic.sensor_list=g.sensor_list;
						            graphic.serviceAddress_list=g.sA_list;
						            graphic.title=g.title;
						            graphic.type=g.type;
						            graphic.sensor_active=g.sensor_active;
						            graphic.minRange=g.minRange;
						            graphic.maxRange=g.maxRange;
						            graphic.coord.x=g.coord.x;
									graphic.coord.y=g.coord.y;
						            charts[idChart]=graphic;
						            RGraph.Effects.Gauge.Grow(chart);
						            enableDragAndDropSensors("drop_canvas-"+idChart);
								}
					            if(graphic.sensor_list.length!=0){
					            	if(graphic.type=="line"){
					            		graphic.graphData.removeColumn(1);
									}
									for(var sens in graphic.sensor_list){
										var sensor_selected=graphic.sensor_list[sens];
										if(graphic.type=="line"){
											graphic.graphData.addColumn('number',sensors[sensor_selected].description);
										}else{
											$('#name-'+graphic.id).text(sensors[sensor_selected].description);
										}
										if(!listeners_numbers.hasOwnProperty(sensor_selected)){
											//add event listener
											sensors[sensor_selected].addEventListener('sensor', onSensorEvent, false);
											listeners_numbers[sensor_selected]=0;
										}
							            listeners_numbers[sensor_selected]++;
							            $('#startstop_cfg_but-'+graphic.id+'-'+sensor_selected).live( 'click',function(event){
							            	var id = this.id.split('-')[1];
							            	var ss = this.id.split('-')[2];
							            	startStopSensor(id,ss);
								        });
							            $('#remove_sensor-'+graphic.id+'-'+sensor_selected).live("click",function(){
							            	removeSensor(graphic,sensor_selected);
							    		});
									}
					            }
					            enableButtonsLive(idChart);
							}
						}
					}
					catch(err){
						//alert(err.message);
					}
				}

				myentry.file(function (fileR) {
					r.readAsText(fileR);
				}, function (error) {
					alert("Error retrieving file (#" + error.name + ")");
				});
			},
			function (error) {
				//if the file data.txt doesn't exist load the default upload image and center it
				alert("Error on read file");
			}
		);
	}
}


function save_graphics(){

	var graphic_to_save = {};
	var serviceAddress_list=[];

	var conf = confirm("Do you want to continue saving?");
	
	
	if(conf){
		for(var x in charts){	
			var graphic= charts[x];
			if(graphic.type=="line"){
				graphic_to_save[x] = {
					id : graphic.id,
					sensor_list : graphic.sensor_list,
					sA_list : graphic.serviceAddress_list,
					title : graphic.title,
					type : graphic.type,
					options : graphic.options,
					sensor_active : graphic.sensor_active,
					minRange : graphic.minRange,
					maxRange : graphic.maxRange,
					coord : graphic.coord
				};
			}else if(graphic.type=="gauge"){
				graphic_to_save[x] = {
					id : graphic.id,
					sensor_list: graphic.sensor_list,
					sA_list : graphic.serviceAddress_list,
					title : graphic.title,
					type : graphic.type,
					sensor_active : graphic.sensor_active,
					minRange : graphic.minRange,
					maxRange : graphic.maxRange,
					coord : graphic.coord
				};
			}else if(graphic.type=="thermometer"){
				graphic_to_save[x] = {
					id : graphic.id,
					sensor_list: graphic.sensor_list,
					sA_list : graphic.serviceAddress_list,
					title : graphic.title,
					type : graphic.type,
					sensor_active : graphic.sensor_active,
					minRange : graphic.minRange,
					maxRange : graphic.maxRange,
					coord : graphic.coord
				};
			}
		}
		console.log(graphic_to_save);
		save_file(graphic_to_save,file_name_for_graphics);
	}
}


function load_graphics(){
	load_file(file_name_for_graphics);
}

function clearAll_for_graphics(){
	
	for(var chart in charts){
		var idChart =chart;
		deleteChart(idChart);	
	}
	
}