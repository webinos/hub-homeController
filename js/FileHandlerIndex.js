function __Utilities__load_file(file_name, successCallback, errorCallback, ask){
	var conf;
	if(ask)
		conf = confirm("Do you want to continue loading?");
	else
		conf = true;
	if(conf){
	    root_directory.getFile(file_name, {create: true, exclusive: false}, 
			function (myentry) {
				var r = new window.FileReader();
				r.onerror = function (evt) {
					//alert("Error reading file (#" + evt.target.error.name + ")");
					errorCallback(evt.target.error);
				}

				r.onload = function (evt) {
					try{
						//alert("Result : "+evt.target.result);
						var contents = JSON.parse(evt.target.result);	
						successCallback(contents);
					}
					catch(err){
						successCallback({});
					}
				}

				myentry.file(function (fileR) {
					r.readAsText(fileR);
				}, function (error) {
					//alert("Error retrieving file (#" + error.name + ")");
					errorCallback(error);
				});
			},
			function (error) {
				//if the file data.txt doesn't exist load the default upload image and center it
				alert("Error on read file");
			}
		);
	}
}


function __Utilities__save_file(data, file_name, ask){
	var conf;
	if(ask)
		conf = confirm("Do you want to continue saving?");
	else
		conf = true;
    if(conf){
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
}