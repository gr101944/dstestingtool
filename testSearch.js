const csv = require('csv-parser');
const fs = require('fs');
var axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

var request_as_promised = require('request-promise');

//QnA Maker configurations

var host = "https://taihopeoplebuddyfaq.azurewebsites.net/qnamaker";
//Replace endpoint_key and KnowledgeBaseId below with actual values
var endpoint_key = "endpoint_key";
var route = "/knowledgebases/knowledgebaseid/generateAnswer";

//Azure Search configurations
const cognitiveSearchURL = "https://testingcognitivesearch.search.windows.net/indexes/azureblob-index/docs?api-version=2020-06-30-Preview"
const apiKey = "xxxx";
var questionSearch = {'question': '','top': 5};

//Input Output files
const inputFolderName = "input";
const outputFolderName = "output";
const inputFileName = "questionsTest.csv"
const outputFileName = "answersQnAMaker.csv"

var questionArray = [];

var outputLocationQnA =  outputFolderName + "/" + outputFileName;
var outputLocationCogtiveSearch = 'output/answersCognitiveSearch.csv'; 
var inputQuestionList = inputFolderName + "/" + inputFileName;


var question = '';
const csvWriterCogSearch = createCsvWriter({
  path: outputLocationCogtiveSearch,
  header: [
    {id: 'question', title: 'Question'},
    {id: 'answer1', title: 'Answer 1'},
    {id: 'confidence1', title: 'Conf. Factor 1'},
    {id: 'answer2', title: 'Answer 2'},
    {id: 'confidence2', title: 'Conf. Factor 2'},
    {id: 'answer3', title: 'Answer 3'},
    {id: 'confidence3', title: 'Conf. Factor 3'},
  ]
});



const csvWriterQnA = createCsvWriter({
    path: outputLocationQnA,
    header: [
      {id: 'question', title: 'Question'},
      {id: 'answer1', title: 'Answer 1'},
      {id: 'confidence1', title: 'Conf. Factor 1'},
      {id: 'source1', title: 'Source 1'},
      {id: 'answer2', title: 'Answer 2'},
      {id: 'confidence2', title: 'Conf. Factor 2'},
      {id: 'source2', title: 'Source 2'},
      {id: 'answer3', title: 'Answer 3'},
      {id: 'confidence3', title: 'Conf. Factor 3'},
      {id: 'source3', title: 'Source 3'},
    ]
  });


var p = 0;

var jsonData = [];
var jsonData2 = [];

var inputRecCount  = 0;

readQuestions ();


async function readQuestions (){
    fs.createReadStream(inputQuestionList)
    .pipe(csv())
    .on('data', (row) => {

    question = row["Question"]
 
     questionArray.push(question)
       inputRecCount = inputRecCount + 1
    })
    .on('end', async() => {
       console.log ("Total number of question being processed by the tool: " + inputRecCount)
    
   
       for (p=0; p < questionArray.length; p++){
           questionSearch.question = questionArray[p]
           //console.log ("Processing Question: " + questionArray[p])
           await getAnswerQnAMaker(questionSearch, p)
           console.log ("Done writing answers to Question " + (p +1))
       }
       console.log ("Done writing QnA Maker answers!")

    //    for (p=0; p < questionArray.length; p++){

    //     await getAnswerCogSearch(questionArray[p])
    //    }
    //    console.log ("Done writing Cognitive Search answers!")
   
   
   
   });

}

async function getAnswerQnAMaker (questionSearch, p) {
    
        try{
        // Add an utterance
         var options = {
            uri: host + route,
            method: 'POST',
            headers: {
                'Authorization': "EndpointKey " + endpoint_key
            },
            json: true,
            body: questionSearch
        };  
      
        var response= await request_as_promised.post(options);
        var noOfAnswers = response.answers.length;
       // console.log (noOfAnswers)
        var answerOne = " ";
        var answerTwo = " ";
        var answerThree = " ";
        var confidenceOne = " ";
        var confidenceTwo = " ";
        var confidenceThree = " ";
        var sourceOne = "";
        var sourceTwo = "";
        var sourceThree = "";
        

        if (noOfAnswers >= 3){

            answerOne = JSON.stringify (response.answers[0].answer);
            confidenceOne = response.answers[0].score
            sourceOne = response.answers[0].source;
            answerTwo = JSON.stringify (response.answers[1].answer);
            confidenceTwo = response.answers[1].score
            sourceTwo = response.answers[1].source;
            answerThree = JSON.stringify (response.answers[2].answer);
            confidenceThree = response.answers[2].score
            sourceThree = response.answers[2].source;

        } else

        if (noOfAnswers === 2){

            answerOne = JSON.stringify (response.answers[0].answer);
            confidenceOne = response.answers[0].score
            sourceOne = response.answers[0].source;
            answerTwo = JSON.stringify (response.answers[1].answer);
            sourceTwo = response.answers[1].source;
            confidenceTwo = response.answers[1].score

            answerThree = "NA";
            confidenceThree = "NA"
            sourceThree = "NA"

        } else

        if (noOfAnswers === 1){

            answerOne = JSON.stringify (response.answers[0].answer);
            confidenceOne = response.answers[0].score
            sourceOne = response.answers[0].source;

            answerTwo = "NA";
            confidenceTwo = "NA";
            sourceTwo = "NA"

            answerThree = "NA";
            confidenceThree = "NA";
            sourceThree = "NA"

        } else

        if (noOfAnswers === 0){

            answerOne = "No Result";
            confidenceOne = "NA";
            sourceOne = "NA"

            answerTwo = "NA";
            confidenceTwo = "NA";
            sourceTwo = "NA"

            answerThree = "NA";
            confidenceThree = "NA";
            sourceThree = "NA"

        }


        jsonData.push({
            "question" : questionSearch.question,
            "answer1": answerOne,
            "confidence1": confidenceOne,
            "source1": sourceOne,
            "answer2": answerTwo,
            "confidence2": confidenceTwo,
            "source2": sourceTwo,
            "answer3": answerThree,
            "confidence3": confidenceThree,
            "source3": sourceThree
   
         });
         csvWriterQnA
         .writeRecords(jsonData)
         .then(()=> {
            // console.log ("Writing answers to Qestion " + (p+1))
            jsonData = []
            
         });
    } catch (err){
        console.log(err.statusCode);
        console.log(err.message);
        console.log(err.error);
    }

    
               
    

    
};

async function getAnswerCogSearch(quest, p) {
    try{

        const config = {
            method: 'get',
            url: cognitiveSearchURL,
            headers: {
            'api-key': apiKey
            
            },
            params: { 
                search: quest,
                top: 5,               
                queryType: "semantic",
                queryLanguage: "en-us"      
            }
        }

  
    
        var answerOne = " ";
        var answerTwo = " ";
        var answerThree = " ";
        var confidenceOne = " ";
        var confidenceTwo = " ";
        var confidenceThree = " ";
    
        let res = await axios(config)
        var length = res.data.value.length;
       // console.log ("Cognitive Search Array length: " + length)

        var val = res.data.value[0];
        var score = val['@search.score']
        var captions = val['@search.captions']


        if (length >= 3){

            var val = res.data.value[0];
            var score = val['@search.score']
            var captions = val['@search.captions']
            answerOne = JSON.stringify (captions[0].text)
            confidenceOne = score

            var val = res.data.value[1];
            var score = val['@search.score']
            var captions = val['@search.captions']
            answerTwo = JSON.stringify (captions[0].text)
            confidenceTwo = score

            var val = res.data.value[2];
            var score = val['@search.score']
            var captions = val['@search.captions']
            answerThree = JSON.stringify (captions[0].text)
            confidenceThree = score

        } else

        if (length === 2){

            var val = res.data.value[0];
            var score = val['@search.score']
            var captions = val['@search.captions']
            answerOne = JSON.stringify (captions[0].text)
            confidenceOne = score

            var val = res.data.value[1];
            var score = val['@search.score']
            var captions = val['@search.captions']
            answerTwo = JSON.stringify (captions[0].text)
            confidenceTwo = score

            answerThree = "NA";
            confidenceThree = "NA"

        } else

        if (length === 1){

            var val = res.data.value[0];
            var score = val['@search.score']
            var captions = val['@search.captions']
            answerOne = JSON.stringify (captions[0].text)
            confidenceOne = score

            answerTwo = "NA";
            confidenceTwo = "NA";

            answerThree = "NA";
            confidenceThree = "NA";

        } else

        if (length === 0){

            answerOne = "No Result";
            confidenceOne = "NA";

            answerTwo = "NA";
            confidenceTwo = "NA";

            answerThree = "NA";
            confidenceThree = "NA";

        }
        jsonData2.push({
            "question" : quest,
            "answer1": answerOne,
            "confidence1": confidenceOne,
            "answer2": answerTwo,
            "confidence2": confidenceTwo,
            "answer3": answerThree,
            "confidence3": confidenceThree,

        });
        csvWriterCogSearch
        .writeRecords(jsonData2)
        .then(()=> {
           
            jsonData2 = []
        });
    } catch (err){
        console.log(err.statusCode);
        console.log(err.message);
        console.log(err.error);
    }

  

  
  }


