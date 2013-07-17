
    var _initialised = false,
        connections = [],
        updateConnections = function(conn, remove) {
            if (!remove){
                connections.push(conn);

                if(conn.sourceId.indexOf("sensor") !== -1){
                    var param = conn.getParameters();
                    settingSensorConnection(conn.sourceId, conn.targetId, param.position);
                }else if(conn.sourceId.indexOf("userInput") !== -1){
                    var param = conn.getParameters();
                    settingUserInputConnection(conn.sourceId, conn.targetId, param.position);
                }else if(conn.sourceId.indexOf("operation") !== -1){
                    //var param = conn.getParameters();
                    //alert(param.position);
                    settingProcessingConnection(conn.sourceId, conn.targetId);
                }
            }
            else {
                var idx = -1;
                for (var i = 0; i < connections.length; i++) {
                    if (connections[i] == conn) {
                        idx = i; break;
                    }
                }
                if (idx != -1) connections.splice(idx, 1);

                if(conn.sourceId.indexOf("sensor") !== -1){
                    var param = conn.getParameters();
                    removeInputConnection(conn.sourceId, conn.targetId, param.position);
                }else if(conn.sourceId.indexOf("userInput") !== -1){
                    var param = conn.getParameters();
                    removeInputConnection(conn.sourceId, conn.targetId, param.position);
                }else if(conn.sourceId.indexOf("operation") !== -1){
                    removeProcessingConnection(conn.sourceId, conn.targetId);
                }

            }

            if (connections.length > 0) {
                for (var j = 0; j < connections.length; j++) {
                    s = "Source: " + connections[j].sourceId + " - Target: " + connections[j].targetId;
                    //alert(s);
                    var params = connections[j].getParameters();
                    //alert(params.position);
                }
            }
        };
    
    window.jsPlumbDemo = {
        init : function() {

            // setup jsPlumb defaults.
            jsPlumb.importDefaults({
                //DragOptions : { cursor: 'pointer', zIndex:2000 },
                PaintStyle : { strokeStyle:'#666' },
                EndpointStyle : { width:20, height:16, strokeStyle:'#666' },
                Endpoint : "Rectangle",
                Anchors : ["TopCenter", "TopCenter"]
            });                                             

            // bind to connection/connectionDetached events, and update the list of connections on screen.
            jsPlumb.bind("connection", function(info, originalEvent) {
                updateConnections(info.connection);
            });
            jsPlumb.bind("connectionDetached", function(info, originalEvent) {
                updateConnections(info.connection, true);
            });

            // three ways to do this - an id, a list of ids, or a selector (note the two different types of selectors shown here...anything that is valid jquery will work of course)
            var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
            jsPlumb.draggable(divsWithWindowClass);


            // init         
            if (!_initialised) {
                $(".hide").click(function() {
                    jsPlumb.toggle($(this).attr("rel"));
                });
    
                $(".drag").click(function() {
                    var s = jsPlumb.toggleDraggable($(this).attr("rel"));
                    $(this).html(s ? 'disable dragging' : 'enable dragging');
                    if (!s)
                        $("#" + $(this).attr("rel")).addClass('drag-locked');
                    else
                        $("#" + $(this).attr("rel")).removeClass('drag-locked');
                    $("#" + $(this).attr("rel")).css("cursor", s ? "pointer" : "default");
                });
    
                $(".detach").click(function() {
                    jsPlumb.detachAllConnections($(this).attr("rel"));
                });
    
                $("#clear").click(function() {
                    jsPlumb.detachEveryConnection();
                    showConnectionInfo("");
                });
                
                _initialised = true;
            }
        }
    };


    Array.prototype.uniq = function uniq() {
        return this.reduce(function(accum, cur) { 
            if (accum.indexOf(cur) === -1) accum.push(cur); 
                return accum; 
            }, [] );
    }

    /***************  ON READY FUNCTION FOR JsPlump Library   *********************/

    jsPlumb.bind("ready", function() {
        jsPlumb.reset();
        jsPlumb.setRenderMode(jsPlumb.SVG);
        jsPlumbDemo.init();

        initGUI();

        $('#refresh').live( 'click',function(event){
            findSensorServices();
        });

        $('#saveRules').live( 'click',function(event){
            save_rules();
        });

        $('#loadRules').live( 'click',function(event){
            load_rules();
        });
    });


