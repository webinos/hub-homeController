
	var sensors = {};
	var sensorActive = {};

	var actuators = {};

	var devsOrientation = {};
	var devsOrientationActive = {};

	var num_boxes = 0;
	var that = this;


	var initGUI = function(leftColumn){
        //findSensorServices(leftColumn);
        addOperationsGUI();
        leftColumn.tinyscrollbar_update(); //in case we find no sensors and operations flow outside the screen
        addDragEventsForTarget();
    }


	function addOperationsGUI(){
		var html = "";
		html += '<div class="sensor"><img width="80px" height="80px" src="./assets/greater.png" id="operation_greater" /><p>Greater than</p></div>';
        html += '<div class="sensor"><img width="80px" height="80px" src="./assets/lesser.png" id="operation_lesser" /><p>Lesser than</p></div>';
        html += '<div class="sensor"><img width="80px" height="80px" src="./assets/and.png" id="bool_and" /><p>AND</p></div>';
        html += '<div class="sensor"><img width="80px" height="80px" src="./assets/or.png" id="bool_or" /><p>OR</p></div>';
        html += '<div class="sensor"><img width="80px" height="80px" src="./assets/user_input.png" id="userInput_input" /><p>User Input</p></div>';
        jQuery("#operations_table").append(html);
        initDragAndDrop("operation_greater");
        initDragAndDrop("operation_lesser");
        initDragAndDrop("bool_and");
        initDragAndDrop("bool_or");
        initDragAndDrop("userInput_input");
	}

	function myConfigureSensor(sensor, isToSave){
		var service_app_id = getId(sensor);
        var div_id = "sensor_"+service_app_id;
        
        var user_name = sensor.serviceAddress.split("@")[0];
        var host = "";
        var device = "";
        var address = user_name;

        if(sensor.serviceAddress.indexOf("@") !== -1){
            address += "<br>";
            var tmp = sensor.serviceAddress.substring(sensor.serviceAddress.indexOf("@")+1).split("/");
            host = tmp[0];
            address += host;
            if(typeof tmp[1] != "undefined"){
                address += "<br>";
                device = tmp[1];
                address += device;
            }
        }

        var formatted_serviceAddress = getFormattedAddress(address, 10);

        var sensorCode = '<div id="code_'+ service_app_id +'" class="sensor">';
        sensorCode += "<div id='remove_"+service_app_id+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-left:-40px;'></img></div>";
        //sensorCode += '<img style="clear:both;" width="80px" height="80px" src="./assets/images/'+icons[sensor.api]+'" id="'+div_id+'" /><p>'+sensor.description+'<br><span class="addr">['+address+']</span></p>';
        sensorCode += '<img style="clear:both;" width="80px" height="80px" src="./assets/images/'+icons[sensor.api]+'" id="'+div_id+'" /><p>'+sensor.description+'<br><span class="addr">['+formatted_serviceAddress+']</span></p>';
        sensorCode += '</div>'; 
        jQuery("#sensors_table").append(sensorCode);

        var leftColumn = $('#leftcolumn');
        leftColumn.tinyscrollbar_update();

        initDragAndDrop(div_id);

        setMinHeight();

        $('#remove_'+service_app_id).on('click',removeSensor);

        //save on file the new sensor added
        if(isToSave == true)
        	save_rules_sa_explorer();
        

    }

    removeSensor = function(event){
    	var sensorID = this.id.substring(7);

    	//remove event listener for button red "remove_sensorID"
    	$('#remove_'+sensorID).unbind('click',removeSensor);

    	overwrite_rules_file(sensorID, "sensor");

    	//Remove all connection which
    	for(x in block_list){
    		if(x.indexOf(sensorID) !== -1)
    			removeSensorBox(x);
    	}

    	//update file
    	//save_rules(false);


        //remove sensor selected from the 'sensors' object
    	delete sensors[sensorID];
    	//update file
    	save_rules_sa_explorer();
    	//update leftColum GUI
    	$("#code_"+sensorID).remove();
    	

    }

    function myConfigureActuator(serviceFounded, isToSave){

    	var service = serviceFounded;
    	serviceFounded.bind({
	        onBind:function(serviceBinded){
	        	var service_app_id = getId(serviceBinded);
	        	actuators[service_app_id] = serviceBinded;
	        	//service = serviceBinded;

	        	//save on file the new actuator added
	        	if(isToSave == true)
                	save_rules_sa_explorer();

		        //actuators[service.id] = service;
		        var div_id = "actuator_"+service_app_id;

		        var user_name = serviceBinded.serviceAddress.split("@")[0];
		        var host = "";
		        var device = "";
		        var address = user_name;

		        if(serviceBinded.serviceAddress.indexOf("@") !== -1){
		            address += "<br>";
		            var tmp = serviceBinded.serviceAddress.substring(serviceBinded.serviceAddress.indexOf("@")+1).split("/");
		            host = tmp[0];
		            address += host;
		            if(typeof tmp[1] != "undefined"){
		                address += "<br>";
		                device = tmp[1];
		                address += device;
		            }
		        }

                var formatted_serviceAddress = getFormattedAddress(address, 10);
		        var actuatorCode = '<div id="code_'+ service_app_id +'" class="sensor">';
		        actuatorCode += "<div id='remove_"+ service_app_id +"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-left:-40px;'></img></div>";
		        //actuatorCode += '<img width="80px" height="80px" src="./assets/images/'+icons[service.api]+'" id="'+div_id+'" /><p>'+service.description+'<br><span class="addr">['+address+']</span></p>'
                actuatorCode += '<img width="80px" height="80px" src="./assets/images/'+icons[serviceBinded.api]+'" id="'+div_id+'" /><p>'+serviceBinded.description+'<br><span class="addr">['+formatted_serviceAddress+']</span></p>'
		        actuatorCode += '</div>';
		        jQuery("#actuators_table").append(actuatorCode);
		       	
		       	var leftColumn = $('#leftcolumn');
		        leftColumn.tinyscrollbar_update();

		        initDragAndDrop(div_id);

		        setMinHeight();

		        $('#remove_'+service_app_id).on('click',removeActuator);
	        }
	    });
    }

    removeActuator = function(event){
    	var actuatorID = this.id.substring(7);

    	//remove event listener for button red "remove_actuatorID"
    	$('#remove_'+actuatorID).unbind('click',removeActuator);

    	overwrite_rules_file(actuatorID, "actuator");

    	//Remove all connection which
    	for(x in block_list){
    		if(x.indexOf(actuatorID) !== -1)
    			removeActuatorBox(x);
    	}

    	//update file
    	//save_rules(false);

        //remove actuator selected from the 'actuators' object
    	delete actuators[actuatorID];
    	//update file
    	save_rules_sa_explorer();
    	//update leftColum GUI
    	$("#code_"+actuatorID).remove();

    }

	function findFileSystem(container) {
    	webinos.discovery.findServices(new ServiceType("http://webinos.org/api/file"), {
			onFound: function (service) {
				if(service.serviceAddress == webinos.session.getPZPId()){
					service.bindService({
						onBind: function () {
							service.requestFileSystem(1, 1024, 
								function (filesystem) {
									root_directory = filesystem.root;

									//load past sensors and actuators selected by user from explorer.
           							load_file(false, file_name_sensor_actuator_explorer);
           							
								},
								function (error) {
									alert("Error requesting filesystem (#" + error.code + ")");
								}
							);					
						}
					});
				}
			}
		});
    }

/******   This function is used only in case you don't use explorer  *****/
/*
	var findSensorServices = function(container){
		jQuery("#sensors_table").empty();
		jQuery("#actuators_table").empty();

		webinos.discovery.findServices(new ServiceType("http://webinos.org/api/*"), {
			onFound: function (service) {
				//found a new sensors
				if(service.api.indexOf("sensors.") !== -1){
					sensors[service.id] = service;
					sensorActive[service.id] = 0;
					
					service.bind({
						onBind:function(){
		        			service.configureSensor({rate: 500, eventFireMode: "fixedinterval"}, 
		        				function(){
		        					myConfigureSensor(service, false);
								},
								function (){
									console.error('Error configuring Sensor ' + service.api);
								}
							);
		        		}
					});
					
				}else if(service.api.indexOf("actuators.") !== -1){
					myConfigureActuator(service, false);
				}
			}
		});
	}
*/
/******   *****   *****   *****   *****   *****   *****   *****   *****/

	//used on load of the html page - i read in the file "file_name_sensor_actuator_explorer" && search the sensor
	function searchSensors(id, serviceAddress){
		webinos.discovery.findServices(new ServiceType("http://webinos.org/api/sensors/*"), {
			onFound: function (service) {
				var service_app_id = getId(service);
				//found a new sensors
				if((service_app_id == id) && (service.serviceAddress == serviceAddress) && (typeof(sensors[service_app_id]) === "undefined")){
					sensors[service_app_id] = service;
					sensorActive[service_app_id] = 0;
					
					service.bind({
						onBind:function(){
		        			service.configureSensor({rate: 500, eventFireMode: "fixedinterval"}, 
		        				function(){
		        					myConfigureSensor(service, false);
								},
								function (){
									console.error('Error configuring Sensor ' + service.api);
								}
							);
		        		}
					});	
				}
			}
		});
	}

	//used on load of the html page - i read in the file "file_name_sensor_actuator_explorer" && search the actuator
	function searchActuators(id, serviceAddress){
		webinos.discovery.findServices(new ServiceType("http://webinos.org/api/actuators/*"), {
			onFound: function (service) {
				var service_app_id = getId(service);
				//found a new sensors
				if((service_app_id == id) && (service.serviceAddress == serviceAddress) && (typeof(actuators[service_app_id]) === "undefined")){
					myConfigureActuator(service, false);
				}
			}
		});
	}

	//used on load of the html page - i read in the file "file_name_sensor_actuator_explorer" && search the sensor
	function searchDeviceOrientation(id, serviceAddress){
		webinos.discovery.findServices(new ServiceType("http://webinos.org/api/deviceorientation"), {
			onFound: function (service) {
				service.bindService({
                    onBind:function(){
						var service_app_id = getId(service);
						//found a new sensors
						if((service_app_id == id) && (service.serviceAddress == serviceAddress) && (typeof(devsOrientation[service_app_id]) === "undefined")){
							devsOrientation[service_app_id] = service;
		                    devsOrientationActive[service_app_id] = 0;
		                    GUIdeviceOrientationRightSide(service, false);	
						}
					}
                });
			}
		});
	}

	function setMinHeight(){
		var height = $("#leftcolumnwrap").height();
		$("#target2").height(height - 55);
	}

	//set onDragStart for all types of boxes
	var addOnDragStart = function(id){

		var box = document.getElementById(id);

		box.ondragstart = function(event) {
			event.dataTransfer.setData("boxes", id);
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

			if(event.preventDefault){
				event.preventDefault();
			}

			//remove class "valid"
			this.className = "";

			var dd_box_name = event.dataTransfer.getData("boxes");
			var boxID = dd_box_name.split("_")[1];
			var boxType = dd_box_name.split("_")[0];

			//var X = event.layerX - $(event.target).position().left;
			//var Y = event.layerY - $(event.target).position().top;
			var X = event.layerX - 150;
			var Y = event.layerY - 100;

			var coord = {
				x:X,
				y:Y
			}

			var result;

			switch(boxType){
				case "sensor":
					result = that.GUISensorBox(coord, sensors[boxID], dd_box_name);
					addInputBox(result);
					break;
				case "operation":
					result = that.GUIOperationBox(coord, boxID, dd_box_name);
					addProcessingBox(result);
					break;
				case "userInput":
					result = that.GUIUserInputBox(coord, dd_box_name);
					addInputBox(result);
					break;
				case "actuator":
					result = that.GUIActuatorBox(coord, actuators[boxID], dd_box_name);
					addOutputBox(result);
					break;
				case "bool":
					result = that.GUIBoolBox(coord, boxID, dd_box_name);
					addProcessingBox(result);
					break;
				case "devOrientation":
					result = that.GUIDeviceOrientation(coord, devsOrientation[boxID], dd_box_name);
					addInputBox(result);
					break;
				default:
					alert("Error - on DRAG AND DROP");
			}
        }
    }

	function initDragAndDrop(id){
		addOnDragStart(id);
		//addDragEventsForTarget();
	}


	/*****************   TO CREATE INPUT/OUTPUT DESIGN   ******************/

	var greeCircle = function(){

		var exampleDropOptions = {
		    tolerance:"touch",
		    hoverClass:"dropHover"
		};
		var color2 = "#316b31";
	    var exampleEndpoint2 = {
	        endpoint:["Dot", { radius:15 }],
            paintStyle:{ fillStyle:color2 },
            isSource:false,
            isTarget:true,
            scope:"idem",
            connectorStyle:{ strokeStyle:color2, lineWidth:8 },
            connector: ["Bezier", { curviness:63 } ],
            maxConnections:-1, //unlimited
            beforeDetach:function(conn) {
                return confirm("Detach connection?"); 
            },
            dropOptions : exampleDropOptions
	    };

	    return exampleEndpoint2;
	}

	var blueRectangle = function(){

		var exampleDropOptions = {
		    tolerance:"touch",
		    hoverClass:"dropHover"
		};

		var exampleColor = "#00f";
	    var exampleEndpoint = {
	        endpoint:"Rectangle",
            paintStyle:{ width:25, height:21, fillStyle:exampleColor },
            isSource:true,
            isTarget:false,
            //reattach:true,
            scope:"idem",
            connectorStyle : {
                gradient:{stops:[[0, exampleColor], [0.5, "#09098e"], [1, exampleColor]]},
                lineWidth:5,
                strokeStyle:exampleColor,
                dashstyle:"2 2"
            },
            maxConnections:-1, //unlimited            
            dropOptions : exampleDropOptions
	    };
	    return exampleEndpoint;      
	}



/*****************     OPERATION   ******************/

	this.GUIOperationBox = function(coord, type, dd_box_name){
		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var html="";
		html += "<div class='window' id='"+idbox+"'>";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += "<div style='clear:both;'>";
		if(type=="greater")
			html += '<img width="80px" height="80px" src="./assets/greater.png" id="greater" /><br><br>';
		else
			html += '<img width="80px" height="80px" src="./assets/lesser.png" id="lesser" /><br><br>';
		html += "</div>";
		html += "</div>";

		$("#main").append(html);

		var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { 
			anchor:"TopRight",
			parameters:{
				position:"right"
			} 
		}, greeCircle());
		jsPlumb.addEndpoint(idbox, { 
			anchor:"TopLeft",
			parameters:{
				position:"left"
			} 
		}, greeCircle());
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
			var boxID = this.id.substring(7);
			var connTMP = [];
			for (var j = 0; j < connections.length; j++){
				if(connections[j].sourceId == boxID){
                    removeProcessingConnection(connections[j].sourceId, connections[j].targetId);
				}else if(connections[j].targetId == boxID){
					var param = connections[j].getParameters();
                    removeInputConnection(connections[j].sourceId, connections[j].targetId, param.position);
				}else{
					connTMP.push(connections[j]);
				}
			}
			connections = connTMP;
			var endps = jsPlumb.getEndpoints(boxID);
            for(var h=0; h<endps.length; h++){
            	jsPlumb.deleteEndpoint(endps[h]);
            }
			deleteBox(boxID);
			$("#"+boxID).remove();
		});

        return idbox;
	}


/*****************     SENSOR   ******************/

	this.GUISensorBox = function(coord, sensor, dd_box_name){

		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var service_app_id = getId(sensor);

        var formatted_serviceAddress = getFormattedAddress(sensor.serviceAddress, 16);
		var html = "";
		html += "<div class='window' id='"+idbox+"' >";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		//html += sensor.description+'<br>['+sensor.serviceAddress+']<br><br>';
        html += sensor.description+'<br>['+formatted_serviceAddress+']<br><br>';
		html += '<img width="80px" height="80px" src="./assets/images/'+icons[sensor.api]+'" id="sensorIMG_'+sensor.id+'" /><br><br>';                     
	    html += "<div id='value_"+service_app_id+"'>-</div>";
	    html += "</div>";

	    $("#main").append(html);

	    var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //add eventListener
        sensor.addEventListener("sensor", function(e){ onSensorEvent(service_app_id, e)}, false);
		//sensorActive[service_app_id] = (sensorActive[service_app_id] + 1);
		if(!sensorActive[service_app_id])
            sensorActive[service_app_id] = 0;
        sensorActive[service_app_id]++;

        //to remove box
        $('#remove_'+idbox).on('click', function(){
        	var boxID = this.id.substring(7);
        	removeSensorBox(boxID);
		});

        return idbox;
	}

	function removeSensorBox(boxID){

        var service_app_id = boxID.split("_")[1];

        sensors[service_app_id].removeEventListener('sensor', function(e){ onSensorEvent(service_app_id, e)}, false);
        sensorActive[service_app_id] = (sensorActive[service_app_id] - 1);

        //remove connections
    	var connTMP = [];
		for (var j = 0; j < connections.length; j++){
			if(connections[j].sourceId == boxID){
				var param = connections[j].getParameters();
                removeInputConnection(connections[j].sourceId, connections[j].targetId, param.position);
			}else{
				connTMP.push(connections[j]);
			}
		}
		connections = connTMP;

		//remove GUI for endpoints
		var endps = jsPlumb.getEndpoints(boxID);
        for(var h=0; h<endps.length; h++){
        	jsPlumb.deleteEndpoint(endps[h]);
        }

        //remove GUI for box
		deleteBox(boxID);
		$("#"+boxID).remove();
	}


/*****************     ACTUATOR   ******************/

	function generalActuatorGUI(idbox, actuator){
		var html = "";
		html += "<div class='window' id='"+idbox+"' >";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += actuator.description+'<br>['+actuator.serviceAddress+']<br><br>';
		html += '<img width="80px" height="80px" src="./assets/images/'+icons[actuator.api]+'" id="actuatorIMG_'+actuator.id+'" /><br><br>';
		html += '<div style="text-align:center">';
		html += '<table style="margin: 0 auto;">';
		html += '<tr>';
		html += '<td>False</td>';
		html += '<td>True</td>';
		html += '</tr>';
		html += '<tr>';
		html += '<td><input type="text" id="actuator_false_'+idbox+'" class="cells_small" /> <br></td>';
		html += '<td><input type="text" id="actuator_true_'+idbox+'" class="cells_small" /></td>';
		html += '</tr>';
		html += '</table>';
		html += '</div>';
	    html += "<div id='value_"+idbox+"'>-</div>";
	    html += "</div>";
	    return html;
	}

	function externalWebServiceGUI(idbox, actuator){
		var html = "";
		html += "<div class='window' id='"+idbox+"' >";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += "<div id='config_"+idbox+"' style='clear:both;'><img  width='17px' height='17px'  src='./assets/config_min.png' style='float:right; margin-bottom:5px; margin-left:5px;'></img></div>"
		html += actuator.description+'<br>['+actuator.serviceAddress+']<br><br>';
		html += '<img width="80px" height="80px" src="./assets/images/'+icons[actuator.api]+'" id="actuatorIMG_'+actuator.id+'" /><br><br>';
	    html += "<div id='value_"+idbox+"'>-</div>";
	    html += "</div>";
	    return html;
	}

	this.GUIActuatorBox = function(coord, actuator, dd_box_name){

		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var service_app_id = getId(actuator);

		var html = "";

		if(actuator.api.indexOf("twitter") !== -1 || actuator.api.indexOf("facebook") !== -1){
			html = externalWebServiceGUI(idbox, actuator);
		}else{
			html = generalActuatorGUI(idbox, actuator);
			//no value for now
			values_sa[service_app_id] = "{}";
		}

	    $("#main").append(html);

	    var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { anchor:"TopCenter" }, greeCircle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
			var boxID = this.id.substring(7);
			removeActuatorBox(boxID);
		});

        $(document).on("click", '#config_'+idbox, function(event){
			var boxID = this.id.substring(7);
			$('#settings-content').empty();
     		$("#settings-container").fadeIn(1000);
     		createPostGUI(boxID);
		});

        //only for FACEBOOK! - TO HANDLER THE LOGIN
		if(actuator.api.indexOf("facebook") !== -1){
			LoadAppIDForFacebook();
		}

        return idbox;
	}


	function LoadAppIDForFacebook(){
		//for facebook - i'm waiting for file api reading (file api search if there is an APP ID)
		//for all rest type of actuator - there isn't any problem		
		load_file(false,file_name_facebook_configure, null, null, null);
	}


	function createPostGUI(boxID){

		$('#settings-content').empty();

		var listTRSensor = {};
		var listTRActuator = {};
		var html = "";
		html += "<div>";
		html += "<div id='input_popup' class='colum_popup'>";
		html += '<table>';
		for(var t in block_list){
			if(t.indexOf("sensor") !== -1){
				var idS = t.split("_")[1];
				//if the sensor is not still insert inside the object
				if(!(idS in listTRSensor)){
					html += '<tr id="tr_'+idS+'" class="tr_popup">';
					html += '<td>'+sensors[idS].description+'</td>';
					html += '</tr>';
					listTRSensor[idS] = idS;
				}
			}
		}
		html += '</table>';
		html += "</div>";

		html += "<div id='output_popup' class='colum_popup'>";
		html += '<table>';
		for(var t in block_list){
			if(t.indexOf("actuator") !== -1){
				var idA = t.split("_")[1];
				//if the actuator is not yet insert inside the object
				if(!(idA in listTRActuator)){
					//if the sensor or actuator is not twitter or facebook
					if(actuators[idA].api.indexOf("twitter") === -1 && actuators[idA].api.indexOf("facebook") === -1){
						html += '<tr id="tr_'+idA+'" class="tr_popup">';
						html += '<td>'+actuators[idA].description+'</td>';
						html += '</tr>';
						listTRActuator[idA] = idA;
					}
				}	
			}
		}
		html += '</table>';
		html += "</div>";

		html += "<\div>";
		var textPosted = "";
		if(textToPost[boxID]!=undefined && textToPost[boxID]!="")
			textPosted = textToPost[boxID];
		html += "<div><textarea id='textarea_post' class='textarea_popup'>"+textPosted+"</textarea></div>";
		html += "<input type='button' value='Save Config' id='btn_post_config'/>";
		$('#settings-content').append(html);

		for(var h in listTRSensor){
			$("#tr_"+h).on('click', function(event){
				var id = this.id.substring(3);
			    var str = "[SENSOR]"+id+"[/SENSOR]";
			    $('#textarea_post').val($('#textarea_post').val()+str); 
			});
		}
		for(var h in listTRActuator){
			$("#tr_"+h).on('click', function(event){
				var id = this.id.substring(3);
			    var str = "[ACTUATOR]"+id+"[/ACTUATOR]";
			    $('#textarea_post').val($('#textarea_post').val()+str); 
			});
		}

		$("#btn_post_config").on('click', function(event){
			//save the content of post inside the object - textToPost [key = idBox; val = Post]
		    textToPost[boxID] = $('#textarea_post').val();
		    var popup = $("#settings-container");
            popup.fadeOut();
		});
	}

	function removeActuatorBox(boxID){
		var connTMP = [];
		for (var j = 0; j < connections.length; j++){
			if(connections[j].targetId == boxID){
                removeProcessingConnection(connections[j].sourceId, connections[j].targetId);
			}else{
				connTMP.push(connections[j]);
			}
		}
		
		connections = connTMP;

		var endps = jsPlumb.getEndpoints(boxID);
        for(var h=0; h<endps.length; h++){
        	jsPlumb.deleteEndpoint(endps[h]);
        }
		deleteBox(boxID);
		$("#"+boxID).remove();
	}

/*****************     DEVICE ORIENTATION   ******************/

	function GUIdeviceOrientationRightSide(service, isToSave){

		var service_app_id = getId(service);
        var div_id = "devOrientation_"+service_app_id;

        //save on file the new actuator added
    	if(isToSave == true)
        	save_rules_sa_explorer();

        var user_name = service.serviceAddress.split("@")[0];
        var host = "";
        var device = "";
        var address = user_name;

        if(service.serviceAddress.indexOf("@") !== -1){
            address += "<br>";
            var tmp = service.serviceAddress.substring(service.serviceAddress.indexOf("@")+1).split("/");
            host = tmp[0];
            address += host;
            if(typeof tmp[1] != "undefined"){
                address += "<br>";
                device = tmp[1];
                address += device;
            }
        }

        var formatted_serviceAddress = getFormattedAddress(address, 10);
        var html = '<div id="code_'+ service_app_id +'" class="sensor">';
        html += "<div id='remove_"+service_app_id+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-left:-40px;'></img></div>";
        html += '<img width="80px" height="80px" src="./assets/images/'+icons[service.api]+'" id="'+div_id+'" /><p>'+service.description+'<br><span class="addr">['+formatted_serviceAddress+']</span></p>'
        html += '</div>';
        jQuery("#sensors_table").append(html);
       	
       	var leftColumn = $('#leftcolumn');
        leftColumn.tinyscrollbar_update();

        initDragAndDrop(div_id);

        setMinHeight();

        //to remove box
        $('#remove_'+service_app_id).on('click', function(){
        	var boxID = this.id.substring(7);
        	removeDeviceOrientation(boxID);
		});

	}

	removeDeviceOrientation = function(devID){

    	overwrite_rules_file(devID, "devOrientation");

    	//Remove all connection which
    	for(x in block_list){
    		if(x.indexOf(devID) !== -1)
    			removeSensorBox(x);
    	}

        //remove sensor selected from the 'sensors' object
    	delete devsOrientation[devID];
    	//update file
    	save_rules_sa_explorer();
    	//update leftColum GUI
    	$("#code_"+devID).remove();
    }

	this.GUIDeviceOrientation = function(coord, device, dd_box_name){
		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var service_app_id = getId(device);

        var formatted_serviceAddress = getFormattedAddress(device.serviceAddress, 16);
		var html = "";
		html += "<div class='window' id='"+idbox+"' >";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
        html += device.description+'<br>['+formatted_serviceAddress+']<br><br>';
		html += '<img width="80px" height="80px" src="./assets/images/'+icons[device.api]+'" id="sensorIMG_'+device.id+'" /><br><br>';    
		html += "<select id='select_"+idbox+"'>";
  		html += "<option value='alfa'>Alfa</option>";
  		html += "<option value='beta'>Beta</option>";
  		html += "<option value='gamma'>Gamma</option>";
		html += "</select>";              
	    html += "<div id='value_alfa_"+service_app_id+"'>Alfa: -</div>";
	    html += "<div id='value_beta_"+service_app_id+"'>Beta: -</div>";
	    html += "<div id='value_gamma_"+service_app_id+"'>Gamma: -</div>";
	    html += "</div>";

	    $("#main").append(html);

	    var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //add eventListener
        device.addEventListener("deviceorientation", function(e){ onDeviceOrientationEvent(service_app_id, e)}, true);
		//devsOrientationActive[service_app_id] = (devsOrientationActive[service_app_id] + 1);
		if(!devsOrientationActive[service_app_id])
            devsOrientationActive[service_app_id] = 0;
        devsOrientationActive[service_app_id]++;

        //to remove box
        $('#remove_'+idbox).on('click', function(){
        	var boxID = this.id.substring(7);
        	removeDeviceOrientationBox(boxID);
		});

        return idbox;
	}

	function removeDeviceOrientationBox(boxID){

        var service_app_id = boxID.split("_")[1];

        devsOrientation[service_app_id].removeEventListener("deviceorientation", function(e){ onDeviceOrientationEvent(service_app_id, e)}, true);
        devsOrientationActive[service_app_id] = (devsOrientationActive[service_app_id] - 1);

        //remove connections
    	var connTMP = [];
		for (var j = 0; j < connections.length; j++){
			if(connections[j].sourceId == boxID){
				var param = connections[j].getParameters();
                removeInputConnection(connections[j].sourceId, connections[j].targetId, param.position);
			}else{
				connTMP.push(connections[j]);
			}
		}
		connections = connTMP;

		//remove GUI for endpoints
		var endps = jsPlumb.getEndpoints(boxID);
        for(var h=0; h<endps.length; h++){
        	jsPlumb.deleteEndpoint(endps[h]);
        }

        //remove GUI for box
		deleteBox(boxID);
		$("#"+boxID).remove();
	}


/*****************     BOOLEAN   ******************/

	this.GUIBoolBox = function(coord, type, dd_box_name){
		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var html="";
		html += "<div class='window' id='"+idbox+"'>";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += "<div style='clear:both;'>";
		if(type=="and")
			html += '<img width="80px" height="80px" src="./assets/and.png" id="and" /><br><br>';
		else
			html += '<img width="80px" height="80px" src="./assets/or.png" id="or" /><br><br>';
		html += "</div>";
		html += "</div>";

		$("#main").append(html);

		var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());

		jsPlumb.addEndpoint(idbox, { anchor:"TopCenter" }, greeCircle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
			var boxID = this.id.substring(7);
			var connTMP = [];
			for (var j = 0; j < connections.length; j++){
				if(connections[j].sourceId == boxID){
                    removeProcessingConnection(connections[j].sourceId, connections[j].targetId);
				}else if(connections[j].targetId == boxID){
					var param = connections[j].getParameters();
                    removeInputConnection(connections[j].sourceId, connections[j].targetId, param.position);
				}else{
					connTMP.push(connections[j]);
				}
			}
			connections = connTMP;
			var endps = jsPlumb.getEndpoints(boxID);
            for(var h=0; h<endps.length; h++){
            	jsPlumb.deleteEndpoint(endps[h]);
            }
			deleteBox(boxID);
			$("#"+boxID).remove();
		});

        return idbox;
	}



/*****************     USER INPUT VALUE    ******************/

	this.GUIUserInputBox = function(coord, dd_box_name){

		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var html = "";
		html += "<div class='window' id='"+idbox+"' >";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='15px' height='15px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += "Insert a value:<br/><br/>";
	    html += "<input type='text' id='input_val_"+idbox+"' /><br/><br/>";
	    html += "</div>";

	    $("#main").append(html);

	    var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
        	var boxID = this.id.substring(7);
        	var connTMP = [];
			for (var j = 0; j < connections.length; j++){
				if(connections[j].sourceId == boxID){
					var param = connections[j].getParameters();
                    removeInputConnection(connections[j].sourceId, connections[j].targetId, param.position);
				}else{
					connTMP.push(connections[j]);
				}
			}
			connections = connTMP;
			var endps = jsPlumb.getEndpoints(boxID);
            for(var h=0; h<endps.length; h++){
            	jsPlumb.deleteEndpoint(endps[h]);
            }
			deleteBox(boxID);
			$("#"+boxID).remove();
		});

        return idbox;
	}

function getFormattedAddress(address, width){
    var sa = address.split('.');
    var formatted_serviceAddress = sa[0];
    for(var i=1; i<sa.length; i++){
        if(sa[i-1].length + sa[i].length < width){
            if(i < sa.length-1)
                formatted_serviceAddress += "." + sa[i];
            else
                formatted_serviceAddress += "." + sa[i];
        }
        else
            formatted_serviceAddress += ".<br>" + sa[i]; 
    }
    return formatted_serviceAddress;   
}