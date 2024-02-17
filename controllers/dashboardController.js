import databaseClient from "../services/database.mjs";
import { ObjectId } from "mongodb";

const MONTH_NUM_TO_NAME = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


function calMonthlySummary( yearmonth , dataSetInArray ) {
  // Prepare output object
  let output = {}
  let targetMonth = new Date(yearmonth)
  let active_date_list = []
  let sum_time = 0
  let sum_minutes = 0
  // Prepare output object -> arrangement mongo document here
  output["userId"] = ""
  output["month"] = yearmonth
  output["active_day"] = ""
  output["sum_time"] = 0
  output["sum_minutes"] = 0
  // Iterate through the data set
  dataSetInArray.map( data => {
      let date = new Date(data["date"],) // '2024-02-04' ISO 8601 format (YYYY-MM-DD)        
      if( targetMonth.getMonth() == date.getMonth() && targetMonth.getFullYear() == date.getFullYear() )  {
          let minutes = (data["duration"].hour * 60 )+ data["duration"].minute
          // push active date number to list
          if( !active_date_list.includes( date.getDate() ) ) // if date not exist, push it
              active_date_list.push ( date.getDate() )
          sum_time += 1
          sum_minutes += minutes
          
          // create key for each type and sum time&mins
          let key_SumMinutesByType = "sum_" + data.type.toLowerCase() + "_mins"
          if( !(key_SumMinutesByType in output) ) // if key not exist, create it 
              output[key_SumMinutesByType] = 0        
          output[key_SumMinutesByType] += minutes

          let key_SumTimesByType = "sum_" + data.type.toLowerCase() + "_times"
          if( !(key_SumTimesByType in output)) // if key not exist, create it
              output[key_SumTimesByType] = 0
          output[key_SumTimesByType] += 1
      }
  }
  )
  // assign data to arranged output
  output["active_day"] = active_date_list
  output["sum_time"] = sum_time
  output["sum_minutes"] = sum_minutes
  return output // return in object format
}

export async function updateMonthlySummary( dateString , userId) {
// Function take creating exercise date -> dateString ("YYYY-MM-DD")
//  and userId -> userId ("xxxxxx")
let processMonth = new Date(dateString) // for check correct date format
let monthString = processMonth.toISOString().slice(0,7) // '2024-02'
const regex = new RegExp(monthString);  // expression for search month in database
// Precedure
// -> call database to get activities data(exercise) targeted month
const summaryData = await databaseClient
                .db()
                .collection("activities")
                .find({ date : regex,
                          userId: new ObjectId(userId)
                        }
                      )
                .toArray();    
// send all exercise in Calculate function for calculate summary
let calculatedMonthlySummary = calMonthlySummary(monthString,summaryData)
calculatedMonthlySummary["userId"] = new ObjectId(userId)
// check is there that month in the data set -> Update
const sumDataInDB = await databaseClient
              .db()
              .collection("activities_sum")
              .findOne({ month : regex,
                          userId: new ObjectId(userId)
                      }
                    )   
// if not, create new object for that month -> Create
if( sumDataInDB ){
  try {
    console.log("Update activities_sum database")
    const result = await databaseClient
      .db()
      .collection("activities_sum")
      .replaceOne({ _id: sumDataInDB._id }, calculatedMonthlySummary);
  } catch (error) {
    console.log(error.message)
  }
} 
else {
  // console.log("Not Exist") 
  try {
    console.log("Update activities_sum database(Create new doc)")
    const result = await databaseClient
      .db()
      .collection("activities_sum")
      .insertOne( calculatedMonthlySummary );
    // console.log(result)
  } catch (error) {
    console.log(error.message)
  }
}

      
// let a = calMonthlySummary("2024-01",summaryData)
// console.log(a)

}


export const getDashboard = async (req, res) => {
  
  let output = {};
  let summaryData = []
  
  try {
      summaryData = await databaseClient
      .db()
      .collection("activities_sum")
      .find({ userId: new ObjectId(req.user.userId) })
      // .find({ userId: userId })   
      .toArray(); 
  }
  catch (error) {
    res.status(500).send(error.message);
  }

  let thisMonthSummary = {};
  let thisMonthSummaryArray = [];
  let today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1; // getMonth() returns zero-based index, so we add 1
  let formattedDate = year + "-" + (month < 10 ? "0" : "") + month; // E
  // console.log("Summary Data")
  // console.log(summaryData)
  
      // set Target month data to be output data main part
  summaryData.map( data => {
      if( data["month"] == formattedDate ) {
        output = data // data of target month only 
      }
    })
    let temp = new Date()
    let sixMonthsBefore = []
    let sixMonthsBeforeRev  = []
    let sixMonthsBeforeYearMonth = []
    for (let i = 0; i <= 5; i++) {
      const monthIndex = (today.getMonth() - i + 12) % 12; 
      // Ensure to loop around to the previous year if needed
      const year_ = today.getMonth() < monthIndex ? today.getFullYear() - 1 : today.getFullYear();
      sixMonthsBefore.push( MONTH_NUM_TO_NAME[monthIndex] )
      sixMonthsBeforeYearMonth.push( year_ + "-" + (monthIndex+1 < 10 ? "0" : "") + (monthIndex+1))
    } 
    // console.log(sixMonthsBeforeYearMonth)
    sixMonthsBeforeRev = sixMonthsBefore.reverse()// [ 'July', 'June', 'May', 'April', 'March', 'February']
    //
    summaryData.map( monthlyData => {
          // Weak position here to convert month number to month name
          let readDataMonth = new Date(monthlyData.month + "-01")
          if(  sixMonthsBeforeYearMonth.includes(monthlyData.month)) {
            let dataForPush  = {name : MONTH_NUM_TO_NAME[ readDataMonth.getMonth() ]
                                , minute : monthlyData.sum_minutes}
            // console.log(readDataMonth.getMonth()+1)
            // console.log(dataForPush)
            thisMonthSummary[dataForPush.name] = dataForPush
          }
        }
        )
    // console.log("List of month to be push")
    // console.log(sixMonthsBeforeRev)
    // console.log("List of month to be push")
    // console.log(thisMonthSummary)
    sixMonthsBeforeRev.map( (monthName, month ) => {
      // console.log(monthName) 
      // console.log(month)
      if( thisMonthSummary[monthName] ) {
        thisMonthSummaryArray.push(thisMonthSummary[monthName])
      }
      else{
        thisMonthSummaryArray.push({name : monthName, minute : 0})
      }
    })
    output["data_for_monthly_chart"] = thisMonthSummaryArray
    // res.json(output);

    let barometerData = []
    try {
      barometerData = await databaseClient
      .db()
      .collection("activities")
      .aggregate(
        [
          {
            '$match': {
              'userId': new ObjectId(req.user.userId)
            }
          }, {
            '$project': {
              '_id': 1, 
              'combinedDateTime': {
                '$toDate': {
                  '$concat': [
                    '$date', 'T', '$startTime'
                  ]
                }
              }, 
              'barometer': {
                '$multiply': [
                  {
                    '$toInt': '$barometer'
                  }, 20
                ]
              }
            }
          }, {
            '$sort': {
              'combinedDateTime': -1
            }
          }, {
            '$limit': 30
          }, {
            '$sort': {
              'combinedDateTime': 1
            }
          }, {
            '$group': {
              '_id': null, 
              'values': {
                '$push': '$barometer'
              }
            }
          }, {
            '$project': {
              '_id': 0, 
              'values': 1
            }
          }
        ])
      .toArray();
    }
    catch (error) {
      res.status(500).send(error.message);
    }
    // barometerData.map( data => {
      // take only barometer value convert to array of integer)

    output["data_for_barometer_chart"] = barometerData

    let lastTenDaysData = []
    
    try {
        var date = new Date();
        date.setDate(date.getDate() - 20);
        // console.log(date)

      lastTenDaysData = await databaseClient
    .db()
    .collection("activities")
    .aggregate(
        [
            {
              '$addFields': {
                'parsedStartDate': {
                  '$toDate': '$date'
                }
              }
            }, {
              '$match': {
                'userId': new ObjectId(req.user.userId), 
                'parsedStartDate': {
                  '$gte': new Date(date)
                }
              }
            }, {
              '$project': {
                '_id': 0, 
                'date': 1, 
              }
            }
          ])
    .toArray();
  }
  catch (error) {
    res.status(500).send(error.message);
  }
  output["data_for_last_ten_days"] = lastTenDaysData

  // console.log("OUTPUT")
  // console.log(output)
  if (!output) {
    res.send([]);  // re design if found problem
  } else {
    res.json(output);
  }

  
}

/* // Template for create new response

  export const getDashboard = async (req, res) => {
  
    // validate if userId is a valid ObjectId
    // if (!ObjectId.isValid(req.params.userId)) {
    //   return res.status(400).send("Invalid userId");
    // }
    console.log(req.user.userId)
  
    const userId = new ObjectId(req.params.userId);
  
    try {
      const activities = await databaseClient
        .db()
        .collection("activities")
        .aggregate([
        ])
        .toArray();

      if (!activities) {
        res.send([]);
      } else {
        res.send(activities);
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
  */