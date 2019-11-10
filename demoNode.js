
/******************************1st Part : Validation ******************************/

//console.log('total arguments are  ' + process.argv.length)
let userEmail = process.argv[2]
//console.log('user email is ' + userEmail)

// check whether user has entered an email address or not
if (userEmail == undefined) {
	console.error('Please enter an email address');
	return;
}

let isCorrectEmail = ValidateEmail(userEmail);
// validate email address
function ValidateEmail(email) 
{
 let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
 return re.test(email);
}
//console.log('isCorrectEmail is ' + isCorrectEmail)
if (!isCorrectEmail) {
	console.error('Please enter a valid email address');
	return;
}

/******************************2nd Part : Get request to retrieve the information about the order******************************/

const https = require('https')
const options = {
  hostname: 'demo7609961.mockable.io',
  port: 443,
  path: '/orders/?customer_email='+userEmail+'',
  method: 'GET'
}
let latestOrderId = '';
const req = https.request(options, res => {

  let data = '';
  res.on("data", data => {
    
	//console.log(data.toString());
    //console.log(JSON.parse(data.toString()));
	data = JSON.parse(data.toString());
	//console.log('data is ' + data["orders"].length);
	
	if (data["orders"] != null && data["orders"].length > 0) {
		let orderArr = data["orders"];
		let shippedOrderArr = new Array();
		for (let i=0;i<orderArr.length;i++) {
			//console.log(orderArr[i].status);
			if (orderArr[i].status == "shipped") {
				shippedOrderArr.push(orderArr[i]);
			}
		}
		//console.log('shippedOrderArr size : '+shippedOrderArr[1]);
		// sort existing orders by date and get a latest order id to make a post request
		const sortedOrders = shippedOrderArr.sort(function(a, b){return new Date(b.date) - new Date(a.date);});
		//console.log('sortedOrders latest date is  : '+sortedOrders[0].date);
		latestOrderId = sortedOrders[0].order_id;
		//console.log('most recent order id is : '+latestOrderId);
	}
});

})

req.on('error', error => {
  console.error(error)
})

req.end()


/******************************2nd Part : Post request to displays the current status of the latest order******************************/
let parseString = require('xml2js').parseString;

const data = JSON.stringify({
  order_id: latestOrderId.toString()
})

const postoptions = {
  hostname: 'demo7609961.mockable.io',
  port: 443,
  path: '/dhl/status/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}

const postreq = https.request(postoptions, res => {
    
	res.on('data', data => {
	parseString(data.toString(), function (err, result) {
		//console.log('JSON response is ' + JSON.stringify(result));
		console.log('Dear Customer, following is your order status:-');
		console.log('Shipment Date : ' + result["shipmentStatus"].shipmentDate);
		console.log('Shipment Last Updated on : ' + result["shipmentStatus"].lastUpdate);
		console.log('Shipment Status : ' + result["shipmentStatus"].status);
		console.log('Shipment Delivered to : ' + result["shipmentStatus"].extraInfo);
	})
  })
})

postreq.on('error', error => {
  console.error(error)
})

postreq.write(data)
postreq.end()