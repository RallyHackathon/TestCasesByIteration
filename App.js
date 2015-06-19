Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    testCaseRecords: [],
    launch: function() {
        var app = this;
        var toolbar = Ext.create('Ext.panel.Panel',{
            items: [
                {
                    xtype: 'rallyprojectcombobox',
                    itemId: 'projectCombo',
                    width: 500,
                    fieldLabel: 'Project',
                    value: Rally.util.Ref.getRelativeUri(Rally.environment.getContext().getScope().project._ref),
                    listeners: {
                        select: function(combo, records) {
                            this._updateTestResultData(records[0].get('_ref'));
                        },
                        scope: app
                    }
                }
            ]
        });
        this.add(toolbar);

        var summaryGridConfig = this._buildSummaryGridConfig();

        this.testStatusSummary = Ext.create('Ext.panel.Panel', {
            items: [
                summaryGridConfig,
                {
                    xtype: 'rallygrid',
                    itemId: 'testsFailedGrid',
                    title: '<B>Tests Failed</B>',
                    emptyText: 'Choose Iteration to see data...',
                    storeConfig: {
                        model: 'TestCase',
                        autoLoad: false
                    },
                    columnCfgs: ['FormattedID', 'Name', {text: 'Tester', dataIndex: 'Owner'}]
                },
                {
                    xtype: 'rallygrid',
                    itemId: 'testsNotRunGrid',
                    title: '<B>Tests Not Run</B>',
                    emptyText: 'Choose Iteration to see data...',
                    storeConfig: {
                        model: 'TestCase',
                        autoLoad: false
                    },
                    columnCfgs: ['FormattedID', 'Name', {text: 'Tester', dataIndex: 'Owner'}]
                },
                {
                    xtype: 'rallygrid',
                    itemId: 'testsPassedGrid',
                    title: '<B>Tests Passed</B>',
                    emptyText: 'Choose Iteration to see data...',
                    storeConfig: {
                        model: 'TestCase',
                        autoLoad: false
                    },
                    columnCfgs: ['FormattedID', 'Name', {text: 'Tester', dataIndex: 'Owner'}]
                }
            ]
        });

        this.add(this.testStatusSummary);

        this._getTestResultData(toolbar.down('#projectCombo').getValue());
    },

    _getTestResultData: function(projectRef) {
        this.testCaseResultStore = Ext.create('Rally.data.WsapiDataStore', {
            model: 'TestCase',
            autoLoad: true,
            storeId: 'TestResultStorer',
            context: {
                project: null
            },
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

        this._updateSummaryStoreWithData(testSummaryData);
        this._updateDetailStoresWithData(this.testCaseRecords);
    },

    _updateSummaryStoreWithData: function(testSummaryData) {
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
    },

    _buildSummaryGridConfig: function() {
        var iterationSummaryModel = Ext.define('IterationSummary', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'Name',  type: 'string'}
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
            columns: {
                items: [
                    {
                        text: 'Name',
                        dataIndex: 'Name'
                    }
                ],
                defaults: {
                    flex: 1
                }
            },
            listeners: {
                cellclick: function(){
                    console.log('cell clicked!');
                }
            },
            columnLines: true,
            enableEditing: true
        };
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
                property : 'Project',
                operator : '=',
                value: projectRef
            },
            {
                property : 'WorkProduct',
                operator : '!=',
                value: null
            }
        ];
    },

    _groupResultsByIteration: function(testCaseRecords) {
        this.iterationIdMap = {};
        return _.reduce(testCaseRecords, function(results, testCase) {
            if (testCase.get('WorkProduct') &&
                testCase.get('WorkProduct').ScheduleState &&
                testCase.get('WorkProduct').ScheduleState === 'In-Progress' &&
                testCase.get('WorkProduct').Iteration) {
                var iterationData = testCase.get('WorkProduct').Iteration;
                var iterationId = iterationData._ref;

                if (!this.iterationIdMap[iterationId]) {
                    this.iterationIdMap[iterationId] = iterationData;
                }

                if (!results[iterationId]) {
                    results[iterationId] = iterationData;
                }
            }
            return results;
        }, {}, this);
    }
});






