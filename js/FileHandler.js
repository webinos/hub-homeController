var root_directory = {};

var file_name_for_rules = "hub_rules.txt";
var file_name_sensor_actuator_explorer = "hub_rules_explorer.txt";

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

/*
	file_name
	show_rules = show in the scree or not.
	id = sensor or actuator id to remove in the file.
	type = is a sensor or is an actuator?
*/
function load_file(askConfirm, file_name, show_rules, id, type){
	var conf = true;

	if(askConfirm==true)
		conf = confirm("Do you want to continue loading?");

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

						//for rules file
						if(file_name == file_name_for_rules && show_rules == true){
							//remove all actual elements inside the target
							clearAll_for_rules();

							//{ old boxID : new boxID }
							var boxIDassociated = {};

							//Create box UI
							for(var u in contents){
								var newBoxID = paintOneBlock(contents[u]);
								boxIDassociated[u] = newBoxID;
							}

							//Creare Connection UI (and object)
							for(var i in contents){
								addConnectionBetweenTwoBoxes(contents[i], boxIDassociated);
							}
						} else if(file_name == file_name_for_rules && show_rules == false){
							var new_contents = {};
							for(var u in contents){
								if((u.indexOf(id) == -1) && (u.indexOf(type) == -1)){

									var connects = contents[u].connections;
									
									var element_tmp = contents[u];
									element_tmp.connections = [];

									for(var i=0; i<connects.length; i++){
										if( ((connects[i].from.indexOf(id) == -1) && (connects[i].from.indexOf(type) == -1)) && ((connects[i].to.indexOf(id) == -1) && (connects[i].to.indexOf(type) == -1)) ){
											element_tmp.connections.push(connects[i]);
										}
									}
									new_contents[u] = element_tmp;
								}
							}
							
							save_file(new_contents,file_name_for_rules);							

						} else if(file_name == file_name_sensor_actuator_explorer){
							//load sensors that user selected in past time.
							for(var t=0; t<contents.explorer_sensors.length; t++){
								searchSensors(contents.explorer_sensors[t].sensorID, contents.explorer_sensors[t].sensorAddress);
							}
							//load actuators that user selected in past time.
							for(var t=0; t<contents.explorer_actuators.length; t++){
								searchActuators(contents.explorer_actuators[t].actuatorID, contents.explorer_actuators[t].actuatorAddress);
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


function save_rules(askConfirm){

	var rules_to_save = {};
	var conf = true;

	if(askConfirm==true)
		conf = confirm("Do you want to continue saving?");

	if(conf){
		for(var x in block_list){		
			rules_to_save[x] = {
				boxID: x,
				address: (function(){
					if(x.indexOf("sensor") !== -1){
						var sid = x.split("_")[1];
						return sensors[sid].serviceAddress;
					}else if(x.indexOf("actuator") !== -1){
						var aid = x.split("_")[1];
						return actuators[aid].serviceAddress;
					}else{
						return "";
					}		
				})(),
				boxType: x.split("_")[0], // possible value: sensor - actuator - operation - bool - userInput
				boxSpecific:x.split("_")[1], // possible value: sensorID - actuatorID - greater - lesser - and - or - input
				userInputValue:(function(){
					//only for userInput Box - save actual value insert by user
					if(x.split("_")[0] == "userInput")
						return $('#input_val_'+x).val();
					else if(x.split("_")[0] == "actuator"){
						return ({
							"false":$('#actuator_false_'+x).val(),
							"true":$('#actuator_true_'+x).val()
						});
					}
					else
						return "";
				})(),
				objType: (function(){
					if(block_list[x] instanceof Input)
						return "Input";
					if(block_list[x] instanceof Processing)
						return "Processing";
					if(block_list[x] instanceof Output)
						return "Output";
				})(),
				coord:{ 
					x: $("#"+x).position().left,
					y: $("#"+x).position().top
				},
				connections:(function(){
					var conn = [];
					for (var j = 0; j < connections.length; j++) {
	                    if(connections[j].sourceId == x){
	                    	conn.push({
	                    		from:connections[j].sourceId,
	                    		to:connections[j].targetId,
	                    		params:connections[j].getParameters()
	                    	});
	                    }
	                }
	                return conn;
				})()
			};
		}
		save_file(rules_to_save,file_name_for_rules);
	}
}

function overwrite_rules_file(id, type){
	//1) Load file of rules
	//2) overwrite the file without block about sensor or actuator removed.

	load_file(false, file_name_for_rules, false, id, type);
	
}

function save_rules_sa_explorer(){

	var rules_to_save = {};

	rules_to_save["explorer_sensors"] = [];
	for(var i in sensors){
		rules_to_save["explorer_sensors"].push({
			sensorID: i,
			sensorAddress: sensors[i].serviceAddress
		});
	}

	rules_to_save["explorer_actuators"] = [];
	for(var h in actuators){
		rules_to_save["explorer_actuators"].push({
			actuatorID: h,
			actuatorAddress: actuators[h].serviceAddress
		});
	}

	setTimeout(function (){
		save_file(rules_to_save,file_name_sensor_actuator_explorer);
	}, 1000);
}


function load_rules(){
	load_file(true, file_name_for_rules, true, null, null);
}


function paintOneBlock(box){
	var id = box.boxID.substring(0,(box.boxID.length-2));
	var result;
	switch(box.boxType){
		case "sensor":
			result = that.GUISensorBox(box.coord, sensors[box.boxSpecific], id);
			addInputBox(result);
			break;
		case "operation":
			result = that.GUIOperationBox(box.coord, box.boxSpecific, id);
			addProcessingBox(result);
			break;
		case "userInput":
			result = that.GUIUserInputBox(box.coord, id);
			$("#input_val_"+result).val(box.userInputValue);
			addInputBox(result);
			break;
		case "actuator":
			result = that.GUIActuatorBox(box.coord, actuators[box.boxSpecific], id);
			$("#actuator_false_"+result).val(box.userInputValue.false);
			$("#actuator_true_"+result).val(box.userInputValue.true);
			addOutputBox(result);
			break;
		case "bool":
			result = that.GUIBoolBox(box.coord, box.boxSpecific, id);
			addProcessingBox(result);
			break;
		default:
			alert("Error");
	}
	return result;
}

function addConnectionBetweenTwoBoxes(box, boxIDassociated){
	//For all connection in which box.boxID is source - i create a connection
	if(box.connections.length > 0){
		for(var j=0; j<box.connections.length; j++){
			var newSourceBoxID = boxIDassociated[box.connections[j].from];
			var newTargetBoxID = boxIDassociated[box.connections[j].to];
			var newParams = box.connections[j].params;

			//alert("newSourceBoxID: " + newSourceBoxID + " - newTargetBoxID: " + newTargetBoxID);

			var sourceEndpoint;
			var targetEndpoint;

			var endps = jsPlumb.getEndpoints(newSourceBoxID);
			if(endps.length == 1){
				sourceEndpoint = endps[0];
			}else{
		        for(var h=0; h<endps.length; h++){
		        	var params = endps[h].getParameters();
		        	//only for greater than and lesser than
		        	if(typeof params !== "undefined"){
		        		if(params.position == newParams.position){
		        			sourceEndpoint = endps[h];
		        			//break;
		        		}
		        	}
		        	if(newSourceBoxID.split("_")[0].indexOf("bool") !== -1){
			        	if(endps[h].isSource == true){
							sourceEndpoint = endps[h];
							break;
			        	}
		        	}
		        }
	    	}

	        var endpt = jsPlumb.getEndpoints(newTargetBoxID);
	      	if(endpt.length == 1){
				targetEndpoint = endpt[0];
			}else{
		        for(var h=0; h<endpt.length; h++){
		        	var params = endpt[h].getParameters();
		        	//only for greater than and lesser than
		        	if(typeof params !== "undefined"){
		        		if(params.position == newParams.position){
		        			targetEndpoint = endpt[h];
		        			//break;
		        		}
		        	}
		        	if(newTargetBoxID.split("_")[0].indexOf("bool") !== -1){
			        	if(endpt[h].isTarget == true){
							targetEndpoint = endpt[h];
							break;
			        	}
		        	}
		        }
	    	}

	    	//create connection
			jsPlumb.connect({ 
				source:sourceEndpoint,
				target:targetEndpoint
			});
	
		}
	}
}

function clearAll_for_rules(){

	//remove event listener:
	for(i in sensorActive){
		numListenerToRemove = sensorActive[i];
		for(var x=0; x<numListenerToRemove; x++)
			sensors[i].removeEventListener('sensor', onSensorEvent, false);
        sensorActive[i] = 0;
	}

	for(x in block_list){
		//remove GUI for endpoints
		var endps = jsPlumb.getEndpoints(x);
		for(var h=0; h<endps.length; h++){
			jsPlumb.deleteEndpoint(endps[h]);
		}
		//remove GUI of box
		$("#"+x).remove();
	}

	block_list = {};
	connections = [];
}