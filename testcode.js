_onTestsLoaded = function(mystore, testrecorddata) {
    that = this;
    that._testResultList = [];
    that._testKeyResultList2=[];
    //console.log(testrecorddata);
    Ext.Array.each(testrecorddata, function(record) {
        var datevar = record.get('Date');
        //test for tester's name on result
        var testerName = record.get('Tester') || "<I>No Tester Name<I>";
        if (testerName !== "<I>No Tester Name<I>") {
            testerName = record.get('Tester')._refObjectName
        }
        that._testResultList.push({
                resID: record.get('TestCase').FormattedID,
                resName: record.get('TestCase')._refObjectName,
                resObject: record.get('TestCase').ObjectID,
                resVerdict: record.get('Verdict'),
                resDate: datevar,
                resTester: testerName,
                resSetID: record.get('TestSet').FormattedID,
                resSet: record.get('TestSet')._refObjectName,
                resSetObject: record.get('TestSet').ObjectID,
                resSetProject: record.get('TestSet').Project.ObjectID,
                resultID: record.get('ObjectID')
        });
    });
    
    //Eliminate tests run more than once
    resultsDeleteArray = [];
    Ext.Array.each(that._testResultList, function(record, index1) {
        Ext.Array.each(that._testResultList, function(otherrecord, index2) {
            if ((record.resID == otherrecord.resID) && (record.resSetID == otherrecord.resSetID) && (record.resultID != otherrecord.resultID) && (record.resSetProject == otherrecord.resSetProject)) {
                //debugger;
                if (record.resDate > otherrecord.resDate) {
                    resultsDeleteArray.push(index2);
                } 
            }
        });
    });
    
    //Eliminate tests run more than once for key test cases
    resultsKeyDeleteArray = [];
    Ext.Array.each(that._testKeyResultList, function(record, index1) {
        Ext.Array.each(that._testKeyResultList, function(otherrecord, index2) {
            if ((record.resID == otherrecord.resID) && (record.resSetID == otherrecord.resSetID) && (record.resultID != otherrecord.resultID) && (record.resSetProject == otherrecord.resSetProject)) {
                //debugger;
                if (record.resDate > otherrecord.resDate) {
                    resultsKeyDeleteArray.push(index2);
                } 
            }
        });
    });
    //Remove older items from the results list  
    resultsDeleteArray.sort(sortNumber);
    resultsDeleteArray.reverse();
    for (var i=0; i<resultsDeleteArray.length; i++) {
        if (resultsDeleteArray[i] == resultsDeleteArray[i+1]) {
            delete resultsDeleteArray[i];
        }
    }
    resultsDeleteArray = resultsDeleteArray.filter(function(n){return n});
    Ext.Array.each(resultsDeleteArray, function(spliceID) {
        that._testResultList.splice(spliceID, 1);
    });
    
    //Remove older items from the key results list  
    resultsKeyDeleteArray.sort(sortNumber);
    resultsKeyDeleteArray.reverse();
    for (var i=0; i<resultsKeyDeleteArray.length; i++) {
        if (resultsKeyDeleteArray[i] == resultsKeyDeleteArray[i+1]) {
            delete resultsKeyDeleteArray[i];
        }
    }
    resultsKeyDeleteArray = resultsKeyDeleteArray.filter(function(n){return n});
    Ext.Array.each(resultsKeyDeleteArray, function(spliceID) {
        that._testResultList.splice(spliceID, 1);
    });
    //clean up dates in results list
    Ext.Array.each(that._testResultList, function(record, index1) {
        datevar = record.resDate; 
        var doubleMonth;
        var doubleDate;
        if ((datevar.getMonth()+1)<10)
        {
            doubleMonth='0'+(datevar.getMonth()+1);
        }
        else
        {
            doubleMonth=(datevar.getMonth()+1);
        }
        if (datevar.getDate()<10)
        {
            doubleDate='0'+datevar.getDate();
        }
        else
        {
            doubleDate=datevar.getDate();
        }
        record.resDate = datevar.getFullYear()+'-'+doubleMonth+'-'+doubleDate;
    });
    
    //clean up dates in results list
    Ext.Array.each(that._testKeyResultList, function(record, index1) {
        datevar = record.resDate; 
        var doubleMonth;
        var doubleDate;
        if ((datevar.getMonth()+1)<10)
        {
            doubleMonth='0'+(datevar.getMonth()+1);
        }
        else
        {
            doubleMonth=(datevar.getMonth()+1);
        }
        if (datevar.getDate()<10)
        {
            doubleDate='0'+datevar.getDate();
        }
        else
        {
            doubleDate=datevar.getDate();
        }
        record.resDate = datevar.getFullYear()+'-'+doubleMonth+'-'+doubleDate;
    });
    //create test set list
    var TestSetList =[];
    var testindex = 0;
    Ext.Array.each(that._testSetTestList, function(record, index) {
        if(index == 0) {
            TestSetList.push(record.resSetID);
            testindex = 1;
        } else {
            var val1 = record.resSetID;
            var val2 = TestSetList[testindex - 1];
            if (val1 !== val2) {
                TestSetList.push(record.resSetID);
                testindex++;
            }
        }
    });
    
    //create test set objectID list for hotlinking
    var TestSetObjList2 =[];
    var testindex = 0;
    Ext.Array.each(that._testSetTestList, function(record, index) {
        if(index == 0) {
            TestSetObjList2.push(record.resSetObject);
            testindex = 1;
        } else {
            var val1 = record.resSetObject;
            var val2 = TestSetObjList2[testindex - 1];
            if (val1 !== val2) {
                TestSetObjList2.push(record.resSetObject);
                testindex++;
            }
        }
    });
    //create test set name list
    var TestSetNameList =[];
    var testindex = 0;
    Ext.Array.each(that._testSetTestList, function(record, index) {
        if(index == 0) {
            TestSetNameList.push(record.resSet);
            testindex = 1;
        } else {
            var val1 = record.resSet;
            var val2 = TestSetNameList[testindex - 1];
            var val3 = record.resSetObject;
            var val4 = TestSetObjList2[testindex - 1];
            //console.log ("val1 = " + val1 + ", val2 = " + val2 + ", val3 = " + val3 + ", val4 = " + val4);
            if ((val1 !== val2) || (val3 !== val4)) {
                //console.log("hit!");
                TestSetNameList.push(record.resSet);
                testindex++;
            }
        }
    });
    //create test set project list for hotlinking
    var TestSetObjList = [];
    var index = TestSetObjList2.length;
    i=0;
    while (i<index) {
        TestSetObjList.push(that._testSetTestList[i].resSetProject);
        i++;
    }
    //obtain counts for each test set
    var totalTestSetCounts = [];
    var testCounters = 0;
    TestSetList.forEach(function(record) {
        Ext.Array.each(that._testSetTestList, function(testsetrecord) {
            if(record == testsetrecord.resSetID) {
                testCounters++;
            }
        });
        totalTestSetCounts.push(testCounters);
        testCounters = 0;
    });
    //obtain test outcome counts for each test set
    var passTestSetCounts = [];
    var failTestSetCounts = [];
    var blockedTestSetCounts = [];
    var errorTestSetCounts = [];
    var otherTestSetCounts =[];
    var testPassCounters = 0;
    var testFailCounters = 0;
    var testBlockedCounters = 0;
    var testErrorCounters = 0;
    var testOtherCounters = 0;
    TestSetList.forEach(function(record) {
        Ext.Array.each(that._testResultList, function(testsetrecord) {
            if(record == testsetrecord.resSetID) {
                if (testsetrecord.resVerdict == "Pass") {
                    testPassCounters++;
                } else if (testsetrecord.resVerdict == "Fail") {
                    testFailCounters++;
                } else if (testsetrecord.resVerdict == "Blocked") {
                    testBlockedCounters++;
                } else if (testsetrecord.resVerdict == "Error") {
                    testErrorCounters++;
                } else if (testsetrecord.resVerdict == "Inconclusive") {
                    testOtherCounters++;
                }
            }
        });
        passTestSetCounts.push(testPassCounters);
        failTestSetCounts.push(testFailCounters);
        blockedTestSetCounts.push(testBlockedCounters);
        errorTestSetCounts.push(testErrorCounters);
        otherTestSetCounts.push(testOtherCounters);
        testPassCounters = 0;
        testFailCounters = 0;
        testBlockedCounters = 0;
        testErrorCounters = 0;
        testOtherCounters = 0;
    });
    //Need to find tests already run by looking at current results and comparing to complete list
    var DeleteArray = [];
    var numTotalTests = that._testSetTestList;
    numTotalTests = numTotalTests.length;
    Ext.Array.each(that._testResultList, function(record, index1) {
        Ext.Array.each(that._testSetTestList, function(otherrecord, index2) {
            if ((record.resObject == otherrecord.resObject) && (record.resSetObject == otherrecord.resSetObject)) {
                DeleteArray.push(index2);
            }
        });
    });
    //Remove items from the complete list to just leave unrun tests
    DeleteArray.sort(sortNumber);
    DeleteArray.reverse();
    for (var i=0; i<DeleteArray.length; i++) {
        if (DeleteArray[i] == DeleteArray[i+1]) {
            delete DeleteArray[i];
        }
    }
    DeleteArrayPre = DeleteArray
    DeleteArray = DeleteArray.filter(function(n){return n});
    
    // filter function strips zeros from end of array - check and re-add if required
    if (DeleteArray.length !== DeleteArrayPre.length) {
        DeleteArray.push(0);
    }
    Ext.Array.each(DeleteArray, function(spliceID) {
        that._testSetTestList.splice(spliceID, 1);
    });
                        
    //Need to find tests already run by looking at current results and comparing to complete list
    var DeleteKeyArray = [];
    Ext.Array.each(that._testKeyResultList2, function(record, index1) {
        Ext.Array.each(that._testSetKeyTestList, function(otherrecord, index2) {
            if ((record.resObject == otherrecord.resObject) && (record.resSetObject == otherrecord.resSetObject)) {
                DeleteKeyArray.push(index2);
            }
        });
    });
    //Remove items from the complete list to just leave unrun tests
    DeleteKeyArray.sort(sortNumber);
    DeleteKeyArray.reverse();
    
    for (var i=0; i<DeleteKeyArray.length; i++) {
        if (DeleteKeyArray[i] == DeleteKeyArray[i+1]) {
            delete DeleteKeyArray[i];
        }
    }
    
    DeleteKeyArray = DeleteKeyArray.filter(function(n){return n});
    
    Ext.Array.each(DeleteKeyArray, function(spliceID) {
        that._testSetKeyTestList.splice(spliceID, 1);
    });
                    
    
    //sum total test status
    var numTestsNotRun = that._testSetTestList;
    numTestsNotRun = numTestsNotRun.length;
    testingPercentComplete = 100 - ((passTestSetCounts/numTotalTests)*100);
    //get the summary data out there for results
    that._testSummary = [];

    TestSetList.forEach(function(record, index) {
        var percentComplete = (((passTestSetCounts[index] + failTestSetCounts[index] + blockedTestSetCounts[index] + errorTestSetCounts[index] + otherTestSetCounts[index])) / totalTestSetCounts[index]);
        if (percentComplete > 1) {
            percentComplete = 1;
        }
        var testingPercentPass = (passTestSetCounts[index]/((passTestSetCounts[index] + failTestSetCounts[index] + blockedTestSetCounts[index] + errorTestSetCounts[index] + otherTestSetCounts[index]))) || 0;
        if (testingPercentPass > 1) {
            testingPercentPass = 1;
        }
        var lefttoRun = (totalTestSetCounts[index] - (passTestSetCounts[index] + failTestSetCounts[index] + blockedTestSetCounts[index] + errorTestSetCounts[index] + otherTestSetCounts[index]));
        if (lefttoRun < 0) {
            lefttoRun = 0;
        }
        
        that._testSummary.push({
            TestSetID: TestSetList[index],
            TestSetName: TestSetNameList[index],
            Passed: passTestSetCounts[index],
            Failed: failTestSetCounts[index],
            Blocked: blockedTestSetCounts[index],
            Error: errorTestSetCounts[index],
            Other: otherTestSetCounts[index],
            ToRun: lefttoRun,
            Total: totalTestSetCounts[index],
            PercentComplete: percentComplete * 100,
            PercentPass: testingPercentPass * 100,
            ProjectObj: TestSetObjList[index],
            TestSetObj: TestSetObjList2[index]
        });
    });
    
    //create grand total aggregates
    var totalPass = 0;
    for (r=0;r<that._testSummary.length;r++)
    {
        totalPass+=that._testSummary[r].Passed;
    }
    var totalFail = 0;
    for (r=0;r<that._testSummary.length;r++)
    {
        totalFail+=that._testSummary[r].Failed;
    }
    var totalBlocked = 0;
    for (r=0;r<that._testSummary.length;r++)
    {
        totalBlocked+=that._testSummary[r].Blocked;
    }
    
    var totalError = 0;
    for (r=0;r<that._testSummary.length;r++)
    {
        totalError+=that._testSummary[r].Error;
    }
    var totalOther = 0;
    for (r=0;r<that._testSummary.length;r++)
    {
        totalOther+=that._testSummary[r].Other;
    }
    var totalToRun = 0;
    for (r=0;r<that._testSummary.length;r++)
    {
        totalToRun+=that._testSummary[r].ToRun;
    }
    var totalTotal = 0;
    for (r=0;r<that._testSummary.length;r++)
    {
        totalTotal+=that._testSummary[r].Total;
    }
 that._testSummary.push({
            TestSetID: '--',
            TestSetName: '<B>TOTALS</B>',
            Passed: totalPass,
            Failed: totalFail,
            Blocked: totalBlocked,
            Error: totalError,
            Other: totalOther,
            Total: totalTotal,
            ToRun: totalToRun,
            PercentComplete: (((totalPass + totalFail + totalBlocked + totalError + totalOther)) / totalTotal) * 100 || 0,
            PercentPass: (totalPass/((totalPass + totalFail + totalBlocked + totalError + totalOther))) * 100 || 0,
            ProjectObj: '',
            TestSetObj: ''
        });
    this._summaryGrid = Ext.create('Rally.ui.grid.Grid', {
        xtype: 'rallygrid',
        store: Ext.create('Rally.data.custom.Store', {
            storeId: 'TestSummaryStore',
            data: that._testSummary,
            autoScroll: true,
            
        }),
        columnLines: true,
        title: '<B>Test Execution Summary</B>',
        //showPagingToolbar: false,
        enableEditing: true,
        columnCfgs: [
            { 
                text: 'Set ID', dataIndex: 'TestSetID' , flex: 1,
                renderer: function(value, meta, record) {
                    var proj = record.get('ProjectObj');
                    var setID = record.get('TestSetObj');
                    var link = "../#/" + proj+ '/detail/testset/' + setID + '/run';
                    return '<a href="' + link + '"target="_parent">' + value + '</a>';
                }
            },
            {
                text: 'Set Name', dataIndex: 'TestSetName', flex: 3
            },
            {
                text: 'EXECUTION', dataIndex: 'PercentComplete',
          
                flex: 2,
                renderer: function (v, m, r) {
                    var id = Ext.id();
                    Ext.defer(function () {
                        Ext.widget('progressbar', {
                            renderTo: id,
                            value: v / 100,
                            width: 100,
                            text: Number(v).toFixed(0) + '%'
                        });
                    }, 50);
                    return Ext.String.format('<div id="{0}"></div>', id);
                }
            },
            {
                text: 'PASSING', dataIndex: 'PercentPass', 
                flex: 2,
                renderer: function (v, m, r) {
                    var id = Ext.id();
                    Ext.defer(function () {
                        Ext.widget('progressbar', {
                            renderTo: id,
                            value: v / 100,
                            width: 100,
                            text: Number(v).toFixed(0) + '%'
                        });
                    }, 50);
                    return Ext.String.format('<div id="{0}"></div>', id);
                }
            },
            {
                text: 'Not Run', dataIndex: 'ToRun', flex: 1,
                renderer: function(value, meta, record) {
                    var newvalue;
                    newvalue = "<span style='color:red' >"+value+"</span>";
                    return newvalue;
                }
            },
            {
                text: 'Passed', dataIndex: 'Passed', flex: 1
            },
            {
                text: 'Failed', dataIndex: 'Failed', flex: 1
            },
            {
                text: 'Blocked', dataIndex: 'Blocked', flex: 1
            },
            {
                text: 'Inconclusive', dataIndex: 'Other', flex: 1
            },
            {
                text: 'Error', dataIndex: 'Error', flex: 1
            },
            {
                text: 'Set Total', dataIndex: 'Total', flex: 1
            }
        ]
    });
    this.down('#testStatus').add(this._summaryGrid);
    //get the data out there for results
    this._Grid2 = Ext.create('Rally.ui.grid.Grid', {
        xtype: 'rallygrid',
        store: Ext.create('Rally.data.custom.Store', {
            storeId: 'TestResultsStore',
            data: that._testResultList,
            autoScroll: true,
            columnLines: true
        }),
        columnLines:true,
        title: '<B>Test Results</B>',
        enableEditing: true,
        columnCfgs: [
            { 
                text: 'Set ID', dataIndex: 'resSetID' , flex: 1,
                renderer: function(value, meta, record) {
                    var proj = record.get('resSetProject');
                    var setID = record.get('resSetObject');
                    var link = "../#/" + proj+ '/detail/testset/' + setID + '/run';
                    return '<a href="' + link + '"target="_parent">' + value + '</a>';
                }
            },
            {
                text: 'Test Set', dataIndex: 'resSet', flex: 2
            },
            { 
                text: 'Test ID', dataIndex: 'resID' , flex: 1,
                renderer: function(value, meta, record) {
                    var proj = record.get('resSetProject');
                    var caseID = record.get('resObject');
                    var link = "../#/" + proj+ '/detail/testcase/' + caseID;
                    return '<a href="' + link + '"target="_parent">' + value + '</a>';
                }
            },
            {
                text: 'Test Name', dataIndex: 'resName', flex: 3
            },
            {
                text: 'Last Verdict', dataIndex: 'resVerdict', flex: 1,
                renderer: function(value, meta, record) {
                    var newvalue;
                    if (value === 'Fail') {
                      newvalue = "<span style='color:red;font-weight:bold' >"+value+"</span>";
                    } else if (value === 'Pass') {
                      newvalue = "<span style='color:green;font-weight:bold' >"+value+"</span>";
                    } else if (value === 'Blocked') {
                      newvalue = "<span style='color:orange;font-weight:bold' >"+value+"</span>";
                    } else if (value === 'Error') {
                      newvalue = "<span style='color:orange;font-weight:bold' >"+value+"</span>";
                    } else {
                      newvalue = "<span style='color:gray;font-weight:bold' >"+value+"</span>";
                    }
                    return newvalue;
                  }
            },
            {
                text: 'Tester Name', dataIndex: 'resTester', flex: 1
            },
            {
                text: 'Execution Date', dataIndex: 'resDate', flex: 1
            }
        ]
    });
    if (TestSetList.length !== 0) {
        this.down('#testStatus1').add(this._Grid2);
    }
                        
    //get the data out there for remaining tests to run
    this._Grid = Ext.create('Rally.ui.grid.Grid', {
        xtype: 'rallygrid',
        store: Ext.create('Rally.data.custom.Store', {
            storeId: 'TestSetStorer',
            data: that._testSetTestList,
            autoScroll: true,
            columnLines: true
        }),
        title: '<B>Tests Remaining to Run</B>',
        columnLines:true,
        enableEditing: true,
        columnCfgs: [
            { 
                text: 'Set ID', dataIndex: 'resSetID' , flex: 1,
                renderer: function(value, meta, record) {
                    var proj = record.get('resSetProject');
                    var setID = record.get('resSetObject');
                    var link = "../#/" + proj+ '/detail/testset/' + setID + '/run';
                    return '<a href="' + link + '"target="_parent">' + value + '</a>';
                }
            },
            {
                text: 'Test Set', dataIndex: 'resSet', flex: 2
            },
            { 
                text: 'Test ID', dataIndex: 'resID' , flex: 1,
                renderer: function(value, meta, record) {
                    var proj = record.get('resSetProject');
                    var caseID = record.get('resObject');
                    var link = "../#/" + proj+ '/detail/testcase/' + caseID;
                    return '<a href="' + link + '"target="_parent">' + value + '</a>';
                }
            },
            {
                text: 'Test Name', dataIndex: 'resName', flex: 2
            }
            /*{ 
                text: 'Add Result', dataIndex: 'resID' , flex: 1,
                renderer: function(value, meta, record) {
                    var proj = record.get('resSetProject');
                    var setID = record.get('resSetObject');
                    var caseID = record.get('resObject');
                    var link = "../tcr/new.sp?cpoid=" + proj + "&projectScopeUp=false&projectScopeDown=false&testCaseOid=" + caseID + "&testSetOid=" + setID;
                    var window = "javascript:void window.open('" + link + "','NewTestResultWindow','width=700,height=500,toolbar=0,menubar=0,location=0,status=1,scrollbars=1,resizable=1,left=0,top=0')";
                    var linker = '<a href="#" onClick="' + window + '">NEW RESULT</a>';
                    return linker;
                }
            }*/
        ]
    });
    if (TestSetList.length !== 0) {
        this.down('#testStatus2').add(this._Grid);
    }
    
    /*var defilter = Ext.create('Rally.data.QueryFilter', {
                                    property: 'State',
                                    operator: '!=',
                                    value: 'Duplicate'
                                });

    defilter = defilter.and({
        property: 'State',
        operator: '!=',
        value: 'Closed'  
    });
    
    defilter = defilter.and({
        property: 'State',
        operator: '!=',
        value: 'Fixed'  
    });
    defilter.toString();
    this.deStore = Ext.create('Rally.data.WsapiDataStore', {
          model: 'Defect',
          id:'defectStore',
          context: {
               project: this.getContext().getDataContext().project,
               projectScopeDown: true
           },
          pageSize: 50,
          autoLoad: true,                         // <----- Don't forget to set this to true! heh
          listeners: {
              load: function(myStore, myData, success) {
                  this._loadDEGrid(myStore);      // if we did NOT pass scope:this below, this line would be incorrectly trying to call _createGrid() on the store which does not exist.
              },
              scope: this                         // This tells the wsapi data store to forward pass along the app-level context into ALL listener functions
          },
          filters:[
                defilter
            ],
          fetch: ['FormattedID', 'Name', 'Owner','ScheduleState','Release','State']   // Look in the WSAPI docs online to see all fields available!
        });*/
}