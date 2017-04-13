/**
 * Created by fokion on 14/04/17.
 */
function ChartController() {
  var me = this;
  var categories = [];
  var data;
  me.setDataTypes = function (types) {
    categories = types;
  };
  me.onDataUpdated = function (rawData) {
    data = rawData;
  };
  function getDataLabels() {
    return categories.map(function (category) {
      return category.label;
    });
  }

  function convertDataForRadar() {
    return {
      "labels": getDataLabels(),
      "datasets": [
        {
          label: "My Second dataset",
          backgroundColor: "rgba(179,181,198,0.2)",
          borderColor: "rgba(179,181,198,1)",
          pointBackgroundColor: "rgba(179,181,198,1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(179,181,198,1)",
          data: categories.map(function () {
            return Math.floor(Math.random() * 100);
          })

        },
        {
          label: "My First dataset",
          backgroundColor: "rgba(255,99,132,0.2)",
          borderColor: "rgba(255,99,132,1)",
          pointBackgroundColor: "rgba(255,99,132,1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(179,181,198,1)",
          data: categories.map(function () {
            return Math.floor(Math.random() * 100);
          })
        }
      ]
    };
  };

  me.getRandarDataSet = function () {
    return {
      "type": "radar",

      "data": convertDataForRadar(),
      "options": {
        "responsive": true
      }
    };
  };
}