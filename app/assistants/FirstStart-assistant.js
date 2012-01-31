function FirstStartAssistant(options) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	this.startOptions = options;
	this.gps = {};
	if (options.gps != undefined)
	{
		this.gps = options.gps;
	}
	this.firstStart = false;
	if (options.firstStart != undefined)
	{
		this.firstStart = true;
		this.location = "Oakville, Ontario, Canada";
		this.scale = 2;
	}
	else {
		this.location = options.location;
		this.scale = options.scale;
	}
	
	if (this.scale === null)
	{
		
		this.scale = 1;
	}
	this.cookie = new Mojo.Model.Cookie("LocationPrefs");
}

FirstStartAssistant.prototype.setup = function() {
	/* Weather Location TextField */
	this.weatherlocationModel = { value: this.location };
	this.controller.setupWidget('weatherlocation', {
		modelProperty : 'value',
		hintText : 'Enter Your Location',
		multiline : false,
		focusMode : Mojo.Widget.focusSelectMode
	}, this.weatherlocationModel);
	
	/* Temperature scale radio */
	this.controller.setupWidget('MyRadioBtn', {
		modelProperty : 'value',
		choices : [ {
			label : 'Fahrenheit',
			value : 1
		}, {
			label : 'Celsius',
			value : 2
		} ]
	}, {
		value : (this.scale == 1) ? 1 : 2
	});
	this.controller.listen('MyRadioBtn', Mojo.Event.propertyChange,
			this.changed.bind(this));
	
//	/* SAVE Button */
	this.controller.setupWidget('okayButton', {}, {
		label : $L("Save")
	});
	this.setTemperatureHandler = this.save.bindAsEventListener(this);
	this.controller.listen('okayButton', Mojo.Event.tap,
			this.setTemperatureHandler);
	
	/* GPS Button */
	this.controller.setupWidget('gpsButton', {}, {
		label : $L("Get GPS Location")
	});
	this.setGPSPositionHandler = this.setGPSPosition.bindAsEventListener(this);
	this.controller.listen('gpsButton', Mojo.Event.tap,
			this.setGPSPositionHandler.bind(this));
	
	this.controller.listen('weatherlocation', Mojo.Event.keypress, this.textChangedEvent.bind(this));
};

FirstStartAssistant.prototype.textChangedEvent = function(event)
{
	
};

FirstStartAssistant.prototype.setGPSPosition = function()
{
	this.getGPSFix();
};

FirstStartAssistant.prototype.getGPSFix = function()
{
	Mojo.Controller.getAppController().showBanner("Locating GPS position.", {source: 'notification'});
	this.controller.serviceRequest('palm://com.palm.location', {
		method:"getCurrentPosition",
		parameters: {
			accuracy: 3,
			maximumAge: 60,
			responseTime: 1
		},
		onSuccess: this.onSuccessHandler.bind(this)
	});
};

FirstStartAssistant.prototype.onSuccessHandler = function(event)
{
	new Ajax.Request('http://maps.googleapis.com/maps/api/geocode/json',
	{
		method:'get',
		parameters: {"latlng" : event.latitude + "," + event.longitude, sensor: true},
		onSuccess: this.locationSuccess.bind(this)
	});
//	this.gps.value =",,," + ( event.latitude * 1000000 )+","+(event.longitude * 1000000);
//	this.gps.key = ( event.latitude * 1000000 )+","+(event.longitude * 1000000);
//	this.controller.get('weatherlocation').mojo.setValue(this.gps.key);
};

FirstStartAssistant.prototype.locationSuccess = function(event)
{
	var self = this;
	var bleh = event.responseText.evalJSON();
	var getAddressComponent = function(component, list){
		for (var i = 0; i < list.length; i++)
		{
			for (var j = 0; j < list[i].types.length; j++)
			{
				if (list[i].types[j] == component)
				{
					return list[i].formatted_address;
				}
			}
		}
		return list[0].formatted_address;
	};
	
	Mojo.Controller.getAppController().showBanner(address, {source: 'notification'});
	
	var address = getAddressComponent('locality', bleh.results);
//	if (!address)
//	{
//		address = bleh.results[0].formatted_address;
//	}

	var locationPrefs = this.cookie.get();
	
	this.controller.get('weatherlocation').mojo.setValue(address);
};

FirstStartAssistant.prototype.changed = function(event) {
	this.scale=event.value;
};

FirstStartAssistant.prototype.save = function(event)
{
	this.setLocation();
};

FirstStartAssistant.prototype.setLocation = function()
{
//	if (this.gps.key == this.controller.get('weatherlocation').mojo.getValue())
	
	this.cookie.put({location: this.controller.get('weatherlocation').mojo.getValue(), scale: this.scale});
	if (this.firstStart != undefined)
	{
		this.controller.stageController.popScene({location : this.controller.get('weatherlocation').mojo.getValue(), scale : this.scale});
		this.controller.stageController.pushScene("Setup");
	}
	else {
		this.controller.stageController.popScene( {location : this.controller.get('weatherlocation').mojo.getValue(), scale : this.scale});
	}
};

FirstStartAssistant.prototype.checkLocation = function(location)
{
	
};

FirstStartAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

FirstStartAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

FirstStartAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};

FirstStartAssistant.prototype.handleCommand = function(event) {
	   Mojo.Log.info("EVENT TYPE" + event.type);
	      if (event.type == Mojo.Event.back) {
	    	  if (this.firstStart == false)
	    	  {
	    		  event.stop(); //use this to stop the back gesture from minimizing your app's card
//	    		  this.setLocation();
	    		  this.controller.stageController.popScene({location : this.startOptions.location, scale : this.startOptions.scale});
	    		  this.controller.stageController.pushScene("Setup");
	    	  }
//	            this.controller.get('MyWebView').mojo.back(); 
	      }
	}