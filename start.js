const rs = GetRootScope();
let _modPath;

const InvestmentModels = [
  {
    name: "Deutsche Bank",
    active: true,
    stockPercentage: 10,
    fondPercentage: 20,
    resourcesPercentage: 70,
    risk: 10,
    costPerDay: 500,
    minimumInvestment: 50000
  },
  {
    name: "J.P. Morgan",
    active: false,
    stockPercentage: 40,
    fondPercentage: 30,
    resourcesPercentage: 30,
    risk: 30,
    costPerDay: 1000,
    minimumInvestment: 50000
  },
  {
    name: "Green Investments",
    active: false,
    stockPercentage: 40,
    fondPercentage: 30,
    resourcesPercentage: 30,
    risk: 30,
    costPerDay: 2000,
    minimumInvestment: 100000
  },
  {
    name: "Blackrock",
    active: false,
    stockPercentage: 60,
    fondPercentage: 20,
    resourcesPercentage: 20,
    risk: 50,
    costPerDay: 2000,
    minimumInvestment: 100000
  }
];

let ChartConfig;
let MyLineChart;

function getLastDays(n) {
  let history = rs.settings.wealthManagementMod.investmentHistory;
  if (history.length > 1) {
    let changeSinceN = 0;
    for (let i = 0; i < n; i++) {
      if (history.length > i) {
        changeSinceN += history[history.length - 1 - i];
      }
    }
    return (changeSinceN * 100).toFixed(4);
  } else {
    return 0;
  }
}

function createChart() {
  let newDayList = [];
  let newProfitList = [];

  let investAmount = rs.settings.wealthManagementMod.investmentAmount;
  let history = rs.settings.wealthManagementMod.investmentHistory;
  let investmentDay = Number.parseInt(
    rs.settings.wealthManagementMod.investmentDay
  );

  newDayList.push("Day " + investmentDay);
  newProfitList.push(investAmount);

  let money = rs.settings.wealthManagementMod.investmentAmount;
  for (let i = 1; i < history.length; i++) {
    let t = investmentDay + i;
    newDayList.push("Day " + t);
    money = money * history[i] + money;
    newProfitList.push(money);
  }

  let ctx = document.getElementById("lineChart").getContext("2d");
  ChartConfig = {
    type: "line",
    data: {
      labels: newDayList,
      datasets: [
        {
          label: "Portfolio profits",
          data: newProfitList,
          backgroundColor: "rgba(0, 128, 0, 0.2)",
          borderColor: "rgba(255, 0, 0, 1)",
          borderWidth: 1
        }
      ]
    },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: false,
              callback: function(value, index, values) {
                if (parseInt(value) >= 1000 || parseInt(value) <= -1000) {
                  return (
                    "$" + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  );
                } else {
                  return "$" + value;
                }
              }
            }
          }
        ],
        xAxes: [
          {
            ticks: {
              beginAtZero: false,
              maxTicksLimit: 20
            }
          }
        ]
      }
    }
  };

  if (MyLineChart == null) {
    MyLineChart = new Chart(ctx, ChartConfig);
  } else {
    MyLineChart.destroy();
    MyLineChart = new Chart(ctx, ChartConfig);
  }
}

exports.initialize = function(modPath) {
  _modPath = modPath;

  exports.views = [
    {
      name: "mod",
      viewPath: _modPath + "view.html",
      controller: function($rootScope) {
        var selectedPlan = 0;
        var settingsEnabled = false;
        let hasInvested = rs.settings.wealthManagementMod.hasInvested;

        if (hasInvested == true) {
          setTimeout(() => {
            createChart();
          }, 200);
        }

        this.payoutAmount = function(amount) {
          let money = getCurrentValue();
        };

        this.getCurrentValue = function() {
          let factor =
            getLastDays(
              rs.settings.wealthManagementMod.investmentHistory.length
            ) / 100;
          return (
            factor * rs.settings.wealthManagementMod.investmentAmount +
            rs.settings.wealthManagementMod.investmentAmount
          );
        };

        this.investAmount = function(amount) {
          var money = 0;
          if (
            rs.settings.wealthManagementMod &&
            rs.settings.wealthManagementMod.hasInvested == true
          ) {
            let factor =
              getLastDays(
                rs.settings.wealthManagementMod.investmentHistory.length
              ) / 100;
            money =
              factor * rs.settings.wealthManagementMod.investmentAmount +
              rs.settings.wealthManagementMod.investmentAmount;

            rs.settings.wealthManagementMod.investAmount = money;
          }

          debugger;

          let hasError = true;
          // Safe buy
          rs.safeBuy(
            function() {
              // If buyed without error
              hasError = false;
            },
            amount,
            "Wealth Management Pay In"
          );
          // If we have an error while buying
          if (hasError) {
            return;
          }

          rs.settings.wealthManagementMod.hasInvested = true;
          rs.settings.wealthManagementMod.investmentAmount = money + amount;
          rs.settings.wealthManagementMod.investmentHistory = [0];
          rs.settings.wealthManagementMod.plan = selectedPlan;
          rs.settings.wealthManagementMod.investmentDay = rs.daysPlayed;

          rs.addTransaction("Wealth Management Pay In", amount);
          setTimeout(() => {
            createChart();
          }, 500);
        };

        this.hasInvested = function() {
          return rs.settings.wealthManagementMod == undefined
            ? false
            : rs.settings.wealthManagementMod.hasInvested;
        };

        this.getInvestedAmount = function() {
          return rs.settings.wealthManagementMod == undefined
            ? 0
            : rs.settings.wealthManagementMod.investmentAmount;
        };

        this.getLastNDays = function(n) {
          return getLastDays(n);
        };

        this.closeInvestment = function() {
          let factor =
            getLastDays(
              rs.settings.wealthManagementMod.investmentHistory.length
            ) / 100;
          let money =
            factor * rs.settings.wealthManagementMod.investmentAmount +
            rs.settings.wealthManagementMod.investmentAmount;

          MyLineChart.destroy();

          rs.settings.wealthManagementMod.hasInvested = false;
          rs.settings.wealthManagementMod.investmentAmount = 0;
          rs.settings.wealthManagementMod.investmentHistory = [0];

          selectedPlan = 0;
          settingsEnabled = false;
                    
          rs.settings.balance += money;
          rs.addTransaction("Close Investment", money);
        };

        this.getCurrentValue = function() {
          let factor = getLastDays(
            rs.settings.wealthManagementMod.investmentHistory.length
          );
          return (
            (factor / 100) * rs.settings.wealthManagementMod.investmentAmount +
            rs.settings.wealthManagementMod.investmentAmount
          );
        };

        // UI Stuff
        this.selectPlan = function(index) {
          InvestmentModels.forEach((v, i, a) => {
            InvestmentModels[i].active = false;
          });
          InvestmentModels[index].active = true;
          selectedPlan = index;
        };

        this.getInvestmentModels = function() {
          return InvestmentModels;
        };

        this.getInvestmentModelPlan = function() {
          return InvestmentModels[selectedPlan];
        };

        this.setSettings = function() {
          settingsEnabled = !settingsEnabled;

          if (settingsEnabled == false) {
            setTimeout(() => {
              createChart();
            }, 200);
          }
        };

        this.settingsEnabled = function () {
            return settingsEnabled;
        };

        this.getBalance = function () {
            return rs.settings.balance;
        }    
      }
    }
  ];

  Modding.setMenuItem({
    name: "mod",
    tooltip: "Wealth Management",
    tooltipPosition: "right",
    faIcon: "fa-suitcase",
    badgeCount: 0
  });
};

exports.onLoadGame = settings => {
  if (settings.wealthManagementMod == undefined) {
    settings.wealthManagementMod = {
      investmentModels: InvestmentModels
    };
  }
};

exports.onNewHour = settings => {};

exports.onNewDay = settings => {
  if (
    settings.wealthManagementMod &&
    settings.wealthManagementMod.hasInvested == true
  ) {
    let todaysInvestmentFactor =
      ((Math.random() * 10 - 3) / 100) *
      (1 +
        settings.wealthManagementMod.investmentModels[
          settings.wealthManagementMod.plan
        ].risk /
          100);

    settings.wealthManagementMod.investmentHistory.push(todaysInvestmentFactor);
    // setTimeout(() => {
    //   createChart();
    // }, 200);
  }
};

exports.onUnsubscribe = done => {};
