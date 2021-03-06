Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    testCaseRecords: [],
    gridMargins: '10 5 10 5',
    launch: function() {
        var app = this;
        // var toolbar = Ext.create('Ext.panel.Panel',{
        //     items: [
        //         {
        //             xtype: 'rallyprojectcombobox',
        //             itemId: 'projectCombo',
        //             width: 500,
        //             fieldLabel: 'Project',
        //             value: Rally.util.Ref.getRelativeUri(Rally.environment.getContext().getScope().project._ref),
        //             listeners: {
        //                 select: function(combo, records) {
        //                     this._updateTestResultData(records[0].get('_ref'));
        //                 },
        //                 scope: app
        //             }
        //         }
        //     ]
        // });
        // this.add(toolbar);
        this.add(this._buildSummaryGridConfig());
        
        this.add({
            xtype: 'rallygrid',
            itemId: 'testsFailedGrid',
            title: '<B>Tests Failed</B>',
            emptyText: 'No Failed Test Cases',
            storeConfig: {
                model: 'TestCase',
                autoLoad: false
            },
            columnCfgs: ['FormattedID', 'Name', {text: 'Tester', dataIndex: 'Owner'}],
            margin: this.gridMargins,
            showPagingToolbar: false
        });
        
        this.add({
            xtype: 'rallygrid',
            itemId: 'testsBlockedGrid',
            title: '<B>Tests Blocked</B>',
            emptyText: 'No Blocked Test Cases',
            storeConfig: {
                model: 'TestCase',
                autoLoad: false
            },
            columnCfgs: ['FormattedID', 'Name', {text: 'Tester', dataIndex: 'Owner'}],
            margin: this.gridMargins,
            showPagingToolbar: false
        });

        this.add({
            xtype: 'rallygrid',
            itemId: 'testsNotRunGrid',
            title: '<B>Tests Not Run</B>',
            emptyText: 'No Test Cases that have not been run',
            storeConfig: {
                model: 'TestCase',
                autoLoad: false
            },
            columnCfgs: ['FormattedID', 'Name', {text: 'Tester', dataIndex: 'Owner'}],
            margin: this.gridMargins,
            showPagingToolbar: false
        });
        this.add({
            xtype: 'rallygrid',
            itemId: 'testsPassedGrid',
            title: '<B>Tests Passed</B>',
            emptyText: 'No Passing Test Cases',
            storeConfig: {
                model: 'TestCase',
                autoLoad: false
            },
            columnCfgs: ['FormattedID', 'Name', {text: 'Tester', dataIndex: 'Owner'}],
            margin: this.gridMargins,
            showPagingToolbar: false
        });

        this.add(this.testStatusSummary);

        //this._getTestResultData(toolbar.down('#projectCombo').getValue());
        var currentProjectRef = Rally.util.Ref.getRelativeUri(Rally.environment.getContext().getScope().project._ref);
        this._getTestResultData(currentProjectRef);
    },

    _getTestResultData: function(projectRef) {
        this.testCaseResultStore = Ext.create('Rally.data.WsapiDataStore', {
            model: 'TestCase',
            autoLoad: true,
            storeId: 'TestResultStorer',
            filters: this._getTestCaseFilters(projectRef),
            fetch: [
                'Name','FormattedID','WorkProduct','ScheduleState','Iteration','Date','LastVerdict','Owner','ObjectID','Project'
            ],
            limit: 200, //TODO: Increase this limit, but then load listener will be called, so need to wait until they are all loaded before compiling the results
            listeners: {
                load: function(store, data, success) {
                    this._onTestResultsLoaded(store, data);
                },
                scope: this
            }
        });
    },

    _onTestResultsLoaded: function(store, recordsArray) {
        this.testCaseRecords = recordsArray; //TODO: concat arrays if there are more than 200 

        var testCaseByIterationMap = this._groupResultsByIteration(this.testCaseRecords);
        var testSummaryData = {
            iterationSummary: _.values(testCaseByIterationMap)
        };

        this.down('#summaryGrid').getStore().loadRawData(testSummaryData);
    },

    _updateDetailStoresWithData: function(records) {
        var testCasesByVerdictMap = _.reduce(records, function(testCasesByVerdict, testCase) {
            var lastVerdict = testCase.get('LastVerdict') || 'NotRun';
            if (!testCasesByVerdict[lastVerdict]) {
                testCasesByVerdict[lastVerdict] = [];
            }
            testCasesByVerdict[lastVerdict].push(testCase);
            return testCasesByVerdict;
        }, {});

        this.down('#testsFailedGrid').getStore().loadData(testCasesByVerdictMap.Fail || []);
        this.down('#testsNotRunGrid').getStore().loadData(testCasesByVerdictMap.NotRun || []);
        this.down('#testsPassedGrid').getStore().loadData(testCasesByVerdictMap.Pass || []);
        this.down('#testsBlockedGrid').getStore().loadData(testCasesByVerdictMap.Blocked || []);
    },

    _buildSummaryGridConfig: function() {
        var iterationSummaryModel = Ext.define('IterationSummary', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'Name',  type: 'string'},
                {name: '_ref',  type: 'string'},
                {name: 'Pass', type: 'number'},
                {name: 'Fail', type: 'number'},
                {name: 'NotRun', type: 'number'},
                {name: 'Blocked', type: 'number'}
            ]
        });

        var testSummaryStore = Ext.create('Ext.data.JsonStore', {
                storeId: 'TestSummaryStore',
                model: iterationSummaryModel,
                proxy: {
                    type: 'memory',
                    reader: {
                        type: 'json',
                        root: 'iterationSummary',
                        idProperty: 'Name'
                    }
                },
                autoScroll: true
            });

        return {
            xtype: 'grid',
            itemId: 'summaryGrid',
            title: '<B>Iteration Summary</B>',
            store: testSummaryStore,
            emptyText: 'No In-Progress test cases for this project',
            columnLines: false,
            margin: this.gridMargins,
            columns: {
                items: [
                
                    {
                        text: 'Name',
                        dataIndex: 'Name'
                    },
                    {
                        text: 'Failed',
                        dataIndex: 'Fail'
                    },
                    {
                        text: 'Blocked',
                        dataIndex: 'Blocked'
                    },
                    {
                        text: 'Not Run',
                        dataIndex: 'NotRun'
                    },
                    {
                        text: 'Passed',
                        dataIndex: 'Pass'
                    }
                    
                ],
                defaults: {
                    flex: 1
                }
            },
            listeners: {
                cellclick: this._onIterationClicked,
                scope: this
            },
            enableEditing: true
        };
    },

    _onIterationClicked: function(grid, td, cellIndex, record, tr, rowIndex, e, eOpts) {
        this._updateDetailStoresWithData(this.iterationTestCaseMap[record.get('_ref')]);
    },

    _updateTestResultData: function(projectRef) {
        var store = this.testCaseResultStore;
        this.testCaseRecords = [];

        store.clearFilter(true);
        store.filter(this._getTestCaseFilters(projectRef));
    },

    _getTestCaseFilters: function(projectRef) {
        return [
            {
                property : 'WorkProduct',
                operator : '!=',
                value: null
            }
        ];
    },

    _groupResultsByIteration: function(testCaseRecords) {
        this.iterationTestCaseMap = {};
        return _.reduce(testCaseRecords, function(results, testCase) {
            if (testCase.get('WorkProduct') &&
                testCase.get('WorkProduct').ScheduleState &&
                testCase.get('WorkProduct').ScheduleState === 'In-Progress' &&
                testCase.get('WorkProduct').Iteration) {
                var iterationData = testCase.get('WorkProduct').Iteration;
                var iterationId = iterationData._ref;

                if (!this.iterationTestCaseMap[iterationId]) {
                    this.iterationTestCaseMap[iterationId] = [];
                }
                this.iterationTestCaseMap[iterationId].push(testCase);

                if (!results[iterationId]) {
                    results[iterationId] = iterationData;
                }

                this._updateIterationVerdictCounts(testCase, results[iterationId]);
            }
            return results;
        }, {}, this);
    },

    _updateIterationVerdictCounts: function(testCase, iterationData) {
        var lastVerdict = testCase.get('LastVerdict') || 'NotRun';
        if (!iterationData[lastVerdict]) {
            iterationData[lastVerdict] = 0;
        }
        iterationData[lastVerdict] += 1;
    }
});






