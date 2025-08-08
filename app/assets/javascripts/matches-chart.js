window.GOVUKPrototypeKit.documentReady(() => {
  // Matches chart
  const matchesChartCanvas = document.getElementById('matchesChart');

  if (matchesChartCanvas) {
    new Chart(matchesChartCanvas, {
      type: 'line',
      data: {
        labels: [
          '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
          '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
          '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
          '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
        ],
        datasets: [{
            label: 'Matches',
            data: [
              225, 200, 215, 220, 215, 220, 220, 210, 230, 245, 240, 250,
              255, 250, 240, 220, 215, 220, 225, 55, 210, 210, 210, 210
            ],
            borderColor: '#5694CA',
            backgroundColor: 'rgba(86, 148, 202, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3
          },
          {
            label: 'No matches',
            data: [
              8, 7, 7, 8, 9, 10, 9, 8, 8, 9, 11, 9,
              10, 10, 9, 10, 10, 11, 12, 9, 9, 9, 10, 9
            ],
            borderColor: '#2BA8A3',
            backgroundColor: 'rgba(43, 168, 163, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#fff',
            borderColor: '#ccc',
            borderWidth: 1,
            titleColor: '#0b0c0c',
            bodyColor: '#0b0c0c',
            titleFont: {
              weight: 'bold',
              size: 14
            },
            bodyFont: {
              size: 14
            },
            padding: 12,
            boxPadding: 6,
            displayColors: false,
            callbacks: {
              title: (context) => `Time: ${context[0].label}`,
              label: (context) => {
                const value = context.formattedValue;
                const label = context.dataset.label;
                return parseInt(value, 10) === 0 ? `No ${label.toLowerCase()}` : `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time of Day'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Volume'
            }
          }
        }
      }
    });
  }

  // Releases chart
  const releasesChartCanvas = document.getElementById('btmsHourlyReleasesChart');

  if (releasesChartCanvas) {
    new Chart(releasesChartCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: [
          "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
          "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
          "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
          "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
        ],
        datasets: [{
            label: "Manual releases",
            data: [
              7, 6, 5, 6, 7, 8,
              9, 8, 7, 6, 5, 4,
              5, 6, 7, 6, 5, 6,
              7, 6, 5, 4, 3, 2
            ],
            borderColor: '#2BA8A3',
            backgroundColor: '#2BA8A3',
            fill: false,
            tension: 0.3,
            pointRadius: 3
          },
          {
            label: "Automatic releases",
            data: [
              230, 220, 210, 215, 230, 240,
              250, 240, 230, 210, 200, 190,
              180, 170, 165, 175, 185, 195,
              200, 195, 180, 170, 160, 150
            ],
            borderColor: '#5694CA',
            backgroundColor: '#5694CA',
            fill: false,
            tension: 0.3,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest', // anchor to the closest point
          intersect: true // require the cursor to be on/near a point
        },
        plugins: {
          legend: {
            display: false
          },

          // match the previous white tooltip design
          tooltip: {
            position: 'nearest',
            backgroundColor: '#fff',
            borderColor: '#ccc',
            borderWidth: 1,
            displayColors: false, // hide the little colour squares
            titleColor: '#0b0c0c',
            bodyColor: '#0b0c0c',
            titleFont: {
              weight: 'bold',
              size: 14
            },
            bodyFont: {
              size: 14
            },
            padding: 12,
            boxPadding: 6,
            callbacks: {
              title: (ctx) => ctx[0].label, // e.g. 08:00
              label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}`
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time of Day'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Volume'
            }
          }
        }
      }

    });
  }
});