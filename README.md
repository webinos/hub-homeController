webinos-app-hub-homeController
==============================

Home Controller Hub with functionality to provide 
- Live data 
- Historical Charts 
- Definition of trigger points 
- Sharing of data 

Hardware: 
- Arduino Portfolio

####How to install the application from github

#####Prerequisites
Home Controller Hub requires the following APIs

* http://webinos.org/api/file
* http://webinos.org/api/sensors
* http://webinos.org/api/actuators
* http://webinos.org/api/w3c/geolocation

Assuming that $PZP_HOME is the path where you have cloned your webinos_pzp module, you should exucute the following commands:

<pre>
  $ cd $PZP_HOME/node_modules
  $ git clone https://github.com/webinos/webinos-api-geolocation.git
  $ cd webinos-api-geolocation
  $ npm install
</pre>

<pre>
  $ cd $PZP_HOME/node_modules
  $ git clone https://github.com/webinos/webinos-api-iot.git
  $ cd webinos-api-iot
  $ npm install
</pre>

<pre>
  $ cd $PZP_HOME/node_modules
  $ git clone https://github.com/webinos/webinos-api-file.git
  $ cd webinos-api-file
  $ npm install
</pre>

#####Install the Home Controller Hub Application
<pre>
  $ cd $PZP_HOME/web_root
  $ git clone https://github.com/webinos/hub-homeController.git homecontroller
</pre>

Then, start the PZP.

#####Run the application

Open in your browser the URL [http://localhost:8080/homecontroller/index.html](http://localhost:8080/homecontroller/index.html)
