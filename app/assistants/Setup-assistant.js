function SetupAssistant() {
	/*
	 * this is the creator function for your scene assistant object. It will be
	 * passed all the additional parameters (after the scene name) that were
	 * passed to pushScene. The reference to the scene controller
	 * (this.controller) has not be established yet, so any initialization that
	 * needs the scene controller should be done in the setup function below.
	 */
	this.firstStart = false;

	this.cookie = new Mojo.Model.Cookie("LocationPrefs");
	
}

SetupAssistant.prototype.setup = function() {
//	this.cookie = new Mojo.Model.Cookie("LocationPrefs");
	var locationPrefs = this.cookie.get();
	if (!locationPrefs) {
		this.controller.stageController.swapScene('FirstStart', { firstStart : true });
	} else {
		this.location = locationPrefs.location;
		this.scale = locationPrefs.scale;

		this.appMenuModel = {
			items : [ {
				label : "About",
				command : 'do-myAbout',
				shortcut : 'a'
			} ]
		};
	
		this.controller.setupWidget(Mojo.Menu.appMenu, {}, this.appMenuModel);
	
		this.cmdMenuModel = {
			visible : true,
			items: [
			        {items:[{label: $L('Refresh'), icon:'refresh', command:'refresh'}]},
			        {items:[{label: $L('Sync'), iconPath:'images/pin.png', command:'sync'}]}
			    ]
		};
		
		this.controller.setupWidget(Mojo.Menu.commandMenu, {
			spacerHeight : 0,
			menuClass : 'no-fade'
		}, this.cmdMenuModel);
	
		this.controller.setupWidget('Spinner', this.spinnerAttributes = {
			spinnerSize : Mojo.Widget.spinnerLarge
		}, this.spinnerModel = {
			spinning : false
		});
		
		this.controller.get('Scrim').hide();
	
		this.controller.setupWidget("ScrollerId", {
			mode : 'horizontal-snap'
		}, this.model = {
			snapElements : {
				x : $$('.scrollerItem')
			},
			snapIndex : 0
		});
		
		this.getWallpaper();
		
		this.loadData();
		this.controller.window.setTimeout(this.loadData.bind(this), 1800000);
	}
};

SetupAssistant.prototype.getWallpaper = function() {
   this.controller.serviceRequest('palm://com.palm.systemservice', 
      {
         method:"getPreferences",
         parameters:{
            "keys":["wallpaper"],
            "subscribe":false
         },
         onSuccess: this.wallpaperSuccess.bind(this),
         onFailure: this.wallpaperFailure.bind(this)
      });
};

SetupAssistant.prototype.wallpaperSuccess = function(responseData) {
	var currentWallpaper = "file://" + responseData.wallpaper.wallpaperFile;
	$$('body')[0].setStyle({
		backgroundImage : "url("+currentWallpaper+")"
	});
};

SetupAssistant.prototype.wallpaperFailure = function(responseData) {
	
};

SetupAssistant.prototype.loadData = function() {
	this.controller.get('Scrim').show();
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	/*
	 * Test
	 */
	var url = "http://www.google.com/ig/api?weather=" + encodeURI(this.location);
	var query = "weather=";

	var xml = new JKL.ParseXML(url);
	var self = this;
	var count = 0;
	
	function asyncLoad(data) {
		if (data) {
			if (data.xml_api_reply.weather.problem_cause) {
				self.addNewLocation();
				Mojo.Controller.getAppController().showBanner("Error: Address not found..", {source: 'error'});
			}else if (self.firstStart === true)
			{
				self.getGPSFix();
			}else {
				
				var list = $('scrollerContainer').select('.scrollerItem');
				
				for ( var i = 0; i < list.length; i++) {
					Element.remove(list[i]);
				}

				Mojo.Controller.getAppController().showBanner(list.length, {source: 'notification'});
				
//				self.controller.get("ScrollerId").mojo.setSnapIndex(0);
				
				var contentParent = self.controller.get('scrollerContainer');
				var currentWeatherObject = data.xml_api_reply.weather;
				var currentCity = currentWeatherObject.forecast_information.city.data;
				/*
				 * Current weather.
				 */
				var currentItem = currentWeatherObject.current_conditions;
				var currentItemForecast = currentWeatherObject.forecast_conditions[0];
				
				var tempdiv = self.createDiv("scrollerItem norm", "scrollerItem:1", "");
				var headerDiv = self.createDiv("header", "", "Today <img src=\"images/rightarrow.png\"/>");
				tempdiv.appendChild(headerDiv);
				tempdiv.appendChild(self.createDiv("palm-divider solid", "", ""));
				
				/*
				 * New Current Weather with Palm Widgets.
				 */
	
				tempdiv.appendChild(self.createDiv("temperature", "", "<span>" + self.convertTemperature(currentItem.temp_f.data) + self.getSign() + "</span>"));
				
				var palmGroup = self.createDiv("palm-group unlabeled", "", "");
				var palmList = self.createDiv("palm-list","","");
				var palmRowWrapper = 
				palmGroup.appendChild(palmList);
				palmList.appendChild(self.createPalmRowDiv("palm-row first", "", "Low", self.convertTemperature(currentItemForecast.low.data) + self.getSign()));
				palmList.appendChild(self.createPalmRowDiv("palm-row", "", "High", self.convertTemperature(currentItemForecast.high.data) + self.getSign()));
				palmList.appendChild(self.createPalmRowDiv("palm-row last", "", "Conditions", currentItem.condition.data));
				
				tempdiv.appendChild(palmGroup);
				/*
				 * End of New Weather widgets.
				 */
				contentParent.appendChild(tempdiv);
				
				/*
				 * forecast weather.
				 */
				for ( var i = 1; i < (currentWeatherObject.forecast_conditions.length < 5 ? currentWeatherObject.forecast_conditions.length
						: 4); i++) {
	
					var currentItem = currentWeatherObject.forecast_conditions[i];
					
					var style = "scrollerItem";
					var img = "";
					var img2 = "";
					if (i == 3)
					{
						style = "scrollerItem last";
						img = "<img src=\"images/leftarrow.png\"/>";
					}
					else {
						style = "scrollerItem norm";
						img = "<img src=\"images/leftarrow.png\"/>";
						img2 = "<img src=\"images/rightarrow.png\"/>";
					}
					var tempdiv = self.createDiv(style, "scrollerItem:"
							+ (i + 1), "");
					var headerDiv = self.createDiv("header", "",
							(i === 0) ? "Today" : img + self
									.getDayOfWeek(currentItem.day_of_week.data) + img2);
					tempdiv.appendChild(headerDiv);
					tempdiv.appendChild(self.createDiv("palm-divider solid", "", ""));
					
					/*
					 * New Palm Widget design
					 */
					tempdiv.appendChild(self.createDiv("forecast", "", "<span>" + currentItem.condition.data + "</span>"));
					var palmGroup = self.createDiv("palm-group unlabeled", "", "");
					var palmList = self.createDiv("palm-list","","");
					var palmRowWrapper = 
					palmGroup.appendChild(palmList);
					palmList.appendChild(self.createPalmRowDiv("palm-row first", "", "Low", self.convertTemperature(currentItem.low.data) + self.getSign()));
					palmList.appendChild(self.createPalmRowDiv("palm-row last", "", "High", self.convertTemperature(currentItem.high.data) + self.getSign()));
					
					tempdiv.appendChild(palmGroup);
					
					/*
					 * End of new design
					 */
					
					var contentDiv = self.createDiv("content", "", "");
					
					var lowtemp = self.convertTemperature(currentItem.low.data);
					if (!lowtemp) {
						contentDiv.appendChild(self.createDiv("temperature", "", "0"));
					} else {
						contentDiv.appendChild(self.createDiv("temperature", "",
								lowtemp));
					}
	
					var hightemp = self.convertTemperature(currentItem.high.data);
					if (!hightemp) {
						contentDiv.appendChild(self.createDiv("highTemperature", "",
								"High of 0" + self.getSign()));
					} else {
						contentDiv.appendChild(self.createDiv("highTemperature", "",
								"High of " + hightemp + self.getSign()));
					}
	
					contentDiv.appendChild(self.createDiv("weatherElements", "",
							currentItem.condition.data));
					
					contentParent.appendChild(tempdiv);
				}
				self.controller.setWidgetModel("ScrollerId", this.model = {
					snapElements : {
						x : $$('.scrollerItem')
					},
					snapIndex : 0
				});
				count = 0;
				self.controller.get("Scrim").hide();
				self.spinnerModel.spinning = false;
				self.controller.modelChanged(self.spinnerModel);
				
				self.model = {
						snapElements : {
							x : $$('.scrollerItem')
						},
						snapIndex : 0
					}
				self.controller.modelChanged(self.model);
			}
		}
		else {
			self.controller.get("Scrim").hide();
			self.spinnerModel.spinning = false;
			self.controller.modelChanged(self.spinnerModel);
			self.model = {
					snapElements : {
						x : $$('.scrollerItem')
					},
					snapIndex : 0
				}
			self.controller.modelChanged(self.model);
		}
	}
	xml.async(asyncLoad);
	xml.parse();
};

SetupAssistant.prototype.getSign = function()
{
//	this.showDialogBox("", this.scale);
	if (this.scale === 2) return "&deg;C";
	else {
		return "&deg;F"
	}
};

SetupAssistant.prototype.getConditionBackground = function(condition) {

};

SetupAssistant.prototype.getDayOfWeek = function(day) {
	switch (day) {
	case "Mon":
		return "Monday";
		break;
	case "Tue":
		return "Tuesday";
		break;
	case "Wed":
		return "Wednesday";
		break;
	case "Thu":
		return "Thursday";
		break;
	case "Fri":
		return "Friday";
		break;
	case "Sat":
		return "Saturday";
		break;
	case "Sun":
		return "Sunday";
		break;
	}
};

SetupAssistant.prototype.temperatureArray = function(temperature) {
	var self = this;
	var div = null;
	if (temperature <= -20) {
		div = self.createDiv("weatherElements", "",
				"Stay inside, it's extremely cold.");
	} else if (temperature <= -10) {
		div = self.createDiv("weatherElements", "",
				"Dress warm, it's very cold.");
	} else if (temperature < 10) {
		div = self.createDiv("weatherElements", "", "Dress warm, it's cold.");
	} else if (temperature < 20) {
		div = self.createDiv("weatherElements", "",
				"Wear a jacket, it's chilly.");
	} else if (temperature >= 35) {
		div = self.createDiv("weatherElements", "",
				"Stay inside, it's very hot.");
	} else if (temperature >= 30) {
		div = self.createDiv("weatherElements", "",
				"Dress lightly, it's very hot.");
	} else if (temperature > 20) {
		div = self.createDiv("weatherElements", "",
				"Enjoy the day, it's great weather.");
	}
	return div;
};

SetupAssistant.prototype.conditionsToArray = function(conditions) {
	if (conditions.toLowerCase().indexOf("snow") != -1) {
		return {
			weather : "snow",
			description : "Dress warm"
		};
	}
	if (conditions.toLowerCase().indexOf("showers") != -1
			|| conditions.toLowerCase().indexOf("rain") != -1
			|| conditions.toLowerCase().indexOf("drizzle") != -1) {
		return {
			weather : "rain",
			description : "Bring an umbrella"
		};
	}
	if (conditions.toLowerCase().indexOf("thunderstorm") != -1) {
		return {
			weather : "thunderstorm",
			description : "Stay inside"
		};
	}
	if (conditions.toLowerCase().indexOf("cloudy") != -1) {
		return {
			weather : "cloudy",
			description : "Dress warm"
		};
	}
	if (conditions.toLowerCase().indexOf("sunny") != -1) {
		return {
			weather : "sunny",
			description : "Wear sunglasses"
		};
	}
	return {
		weather : "cloudy",
		description : "Wear sunglasses"
	};
};

SetupAssistant.prototype.convertTemperature = function(temp) {
	if (this.scale === 2)
	{
		var retval = (temp - 32) * 5 / 9;
		return Math.round(retval);
	}
	return temp;
};

SetupAssistant.prototype.createDiv = function(style, id, text) {
	var div = document.createElement('div');
	if (text || !text === "")
		div.innerHTML = text;
	if (!id === "")
		div.setAttribute('id', id);
	div.setAttribute('class', style);

	return div
};

SetupAssistant.prototype.createPalmRowDiv = function(style, id, label, title) {
	var div = document.createElement('div');
	var wrapper = document.createElement('div');
	
	wrapper.innerHTML = "<div class=\"matbeeLabel\">" + label + "</div><div class=\"matbeeTitle\">" + title + "</div>";
	if (!id === "")
		div.setAttribute('id', id);
	div.setAttribute('class', style);
	wrapper.setAttribute('class', "palm-row-wrapper");
	div.appendChild(wrapper);
	return div
};

SetupAssistant.prototype.showDialogBox = function(caption, msg) {
	this.controller.showAlertDialog( {
		onChoose : function(value) {
		},
		title : caption,
		message : msg,
		choices : [ {
			label : 'OK',
			value : 'OK',
			type : 'dismiss'
		} ]
	});
};

SetupAssistant.prototype.addNewLocation = function() {
//	this.controller.showDialog( {
//		template : 'Setup/addLocation-dialog',
//		assistant : new PickLocationAssistant(this,
//				this.location, this.scale, this.locationCallback
//						.bind(this))
//	});
//	this.controller.pushScene('FirstStart');
	this.controller.stageController.swapScene('FirstStart', {location : this.location, scale : this.scale});
};

SetupAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.commandEnable
			&& (event.command == Mojo.Menu.helpCmd || event.command == Mojo.Menu.prefsCmd)) {
		event.stopPropagation();
	}

	this.controller = Mojo.Controller.stageController.activeScene();
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
		case 'do-myAbout':
			this.controller.showAlertDialog( {
				onChoose : function(value) {
				},
				title : $L("The Weather Outside"),
				message : $L("MatBee Products, Copyright 2011"),
				choices : [ {
					label : $L("OK"),
					value : ""
				} ]
			});
			break;
		case Mojo.Menu.prefsCmd:
			this.addNewLocation();
			break;

		case 'refresh':
			this.loadData();
			break;
		case 'sync':
			this.getGPSFix();
			break;
		}
	}
};

SetupAssistant.prototype.locationCallback = function(e, temperature, self) {
	
//	self.showDialogBox("", temperature);
	self.cookie.put( {
		"location" : e,
		"scale" : temperature
	});
	self.scale = temperature;
	self.location = e;
	self.loadData();
};

SetupAssistant.prototype.getGPSFix = function()
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

SetupAssistant.prototype.onSuccessHandler = function(event)
{
	var self = this;
	new Ajax.Request('http://maps.googleapis.com/maps/api/geocode/json',
	{
		method:'get',
		parameters: {"latlng" : event.latitude + "," + event.longitude, sensor: true},
		onSuccess: this.locationSuccess.bind(this)
	});
};

SetupAssistant.prototype.locationSuccess = function(event)
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
	
	this.setLocation(address);
	this.loadData();
};

SetupAssistant.prototype.setLocation = function (location)
{
	Mojo.Controller.getAppController().showBanner(location, {source: 'notification'});
	this.location = location;
	this.cookie.put({"location" : location, "scale" : this.scale});
};

SetupAssistant.prototype.activate = function(event) {
	
	if (event != undefined && event.location != undefined)
	{
		this.location = event.location;
		this.scale = event.scale;
		
//		this.loadData();
	}
	else {
		var locationPrefs = this.cookie.get();
		if (!locationPrefs) {
			this.controller.stageController.swapScene('FirstStart', {firstStart : true});
		}
		else {
			this.location = locationPrefs.location;
			this.scale = locationPrefs.scale;
//			this.loadData();
//			this.controller.modelChanged(this.model);
		}
	}

	this.handleUpdate = this.onScroll.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get("ScrollerId"), Mojo.Event.propertyChange, this.handleUpdate, true);
};

SetupAssistant.prototype.deactivate = function(event) {
	/*
	 * remove any event handlers you added in activate and do any other cleanup
	 * that should happen before this scene is popped or another scene is pushed
	 * on top
	 */
};

SetupAssistant.prototype.cleanup = function(event) {
	/*
	 * this function should do any cleanup needed before the scene is destroyed
	 * as a result of being popped off the scene stack
	 */
};

SetupAssistant.prototype.onScroll = function(event) {
	this.currentScroll = event.value;
};
