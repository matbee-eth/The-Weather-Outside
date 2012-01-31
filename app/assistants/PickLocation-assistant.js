function PickLocationAssistant(sceneAssistant, currentlocation, scale, callBackFunc) {
	this.sceneAssistant = sceneAssistant;
	this.callBackFunc = callBackFunc;
	this.currentlocation = currentlocation;
	this.scale = scale;
	if (this.scale === null)
	{
		this.scale = 1;
	}
}

PickLocationAssistant.prototype.setup = function(widget) {
	this.widget = widget;
	this.weatherlocationModel = { value: this.currentlocation };
	this.sceneAssistant.controller.setupWidget('weatherlocation', {
		modelProperty : 'value',
		hintText : 'Enter Your Location',
		multiline : false,
		focusMode : Mojo.Widget.focusSelectMode
	}, this.weatherlocationModel);
	
	this.sceneAssistant.controller.setupWidget('MyRadioBtn', {
		modelProperty : 'value',
		choices : [ {
			label : 'Fahrenheit',
			value : 1
		}, {
			label : 'Celcius',
			value : 2
		} ]
	}, {
		value : (this.scale == 1) ? 1 : 2
	});
	
	this.sceneAssistant.controller.listen('MyRadioBtn', Mojo.Event.propertyChange,
			this.changed.bind(this));

	this.sceneAssistant.controller.setupWidget('okayButton', {}, {
		label : $L("Save")
	});

	this.setTemperatureHandler = this.setLocation.bindAsEventListener(this);
	this.sceneAssistant.controller.listen('okayButton', Mojo.Event.tap,
			this.setTemperatureHandler);
	
	
	this.sceneAssistant.controller.setupWidget('gpsButton', {}, {
		label : $L("Get GPS Location")
	});

	this.setGPSPositionHandler = this.setGPSPosition.bindAsEventListener(this);
	this.sceneAssistant.controller.listen('gpsButton', Mojo.Event.tap,
			this.setGPSPositionHandler.bind(this));
};

PickLocationAssistant.prototype.setGPSPosition = function()
{
	this.getGPSFix();
};

PickLocationAssistant.prototype.getGPSFix = function()
{
	Mojo.Controller.getAppController().showBanner("Locating GPS position.", {source: 'notification'});
	this.sceneAssistant.controller.serviceRequest('palm://com.palm.location', {
		method:"getCurrentPosition",
		parameters: {
			accuracy: 3,
			maximumAge: 60,
			responseTime: 1
		},
		onSuccess: this.onSuccessHandler.bind(this)
	});
};

PickLocationAssistant.prototype.onSuccessHandler = function(event)
{
	Mojo.Controller.getAppController().showBanner("Position Retrieved.", {source: 'notification'});
	new Ajax.Request('http://maps.googleapis.com/maps/api/geocode/json',
	{
		method:'get',
		parameters: {"latlng" : event.latitude + "," + event.longitude, sensor: true},
		onSuccess: this.locationSuccess.bind(this)
	});
};

PickLocationAssistant.prototype.locationSuccess = function(event)
{
	var self = this;
	var bleh = event.responseText.evalJSON();
	this.cookie = new Mojo.Model.Cookie("LocationPrefs");
	var locationPrefs = this.cookie.get();
	this.cookie.put({location: bleh.results[0].formatted_address, scale: this.scale});
	this.callBackFunc(bleh.results[0].formatted_address, this.scale, this.sceneAssistant);
	this.widget.mojo.close();
};

PickLocationAssistant.prototype.changed = function(event) {
	this.scale=event.value;
};

PickLocationAssistant.prototype.setLocation = function() {
	var out = this.sceneAssistant.controller.get("weatherlocation").mojo
			.getValue();
	
	var url = "http://www.google.com/ig/api?weather=" + encodeURI(out);
	var xml = new JKL.ParseXML(url);
	var self = this;
	var data = xml.parse();
	
	if (!data.xml_api_reply.weather.problem_cause) {
		this.cookie = new Mojo.Model.Cookie("LocationPrefs");
		var locationPrefs = this.cookie.get();
		this.cookie.put({location: out, scale: this.scale});
		
		this.callBackFunc(out, this.scale, this.sceneAssistant);
		this.widget.mojo.close();
	}
	else {
		this.sceneAssistant.controller.get("dialog-title").innerHTML = "Enter a valid address.";
	}
};

PickLocationAssistant.prototype.activate = function(event) {
	/*
	 * put in event handlers here that should only be in effect when this scene
	 * is active. For example, key handlers that are observing the document
	 */
};

PickLocationAssistant.prototype.deactivate = function(event) {
	/*
	 * remove any event handlers you added in activate and do any other cleanup
	 * that should happen before this scene is popped or another scene is pushed
	 * on top
	 */
};

PickLocationAssistant.prototype.cleanup = function(event) {
	this.sceneAssistant.controller.stopListening('okayButton', Mojo.Event.tap,
			this.useDateTimeHandler);
};
