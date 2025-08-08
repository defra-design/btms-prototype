window.GOVUKPrototypeKit.documentReady(() => {
  function createChart(canvas, labels, datasets) {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest', // or 'index' if you want all series at that x
          intersect: false
        },
        elements: {
          point: {
            radius: 3,
            hitRadius: 12, // make the hover target bigger
            hoverRadius: 6
          }
        },

        plugins: {
          legend: {
            display: false
          },

          tooltip: {
            backgroundColor: '#fff',
            borderColor: '#ccc',
            borderWidth: 1,
            displayColors: false, // no coloured square
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
              title: (ctx) => `Time: ${ctx[0].label}`,
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








  // Matches chart
  const matchesChartCanvas = document.getElementById('matchesChart');
  if (matchesChartCanvas) {
    createChart(matchesChartCanvas,
      [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
      ],
      [{
          label: 'Matches',
          data: [225, 200, 215, 220, 215, 220, 220, 210, 230, 245, 240, 250, 255, 250, 240, 220, 215, 220, 225, 55, 210, 210, 210, 210],
          borderColor: '#5694CA',
          backgroundColor: 'rgba(86,148,202,0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3
        },
        {
          label: 'No matches',
          data: [8, 7, 7, 8, 9, 10, 9, 8, 8, 9, 11, 9, 10, 10, 9, 10, 10, 11, 12, 9, 9, 9, 10, 9],
          borderColor: '#2BA8A3',
          backgroundColor: 'rgba(43,168,163,0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3
        }
      ]
    );
  }

  // Releases chart
  const releasesChartCanvas = document.getElementById('btmsHourlyReleasesChart');
  if (releasesChartCanvas) {
    createChart(releasesChartCanvas.getContext('2d'),
      [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
      ],
      [{
          label: 'Manual releases',
          data: [7, 6, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 5, 6, 7, 6, 5, 6, 7, 6, 5, 4, 3, 2],
          borderColor: '#2BA8A3',
          backgroundColor: '#2BA8A3',
          fill: false,
          tension: 0.3,
          pointRadius: 3
        },
        {
          label: 'Automatic releases',
          data: [230, 220, 210, 215, 230, 240, 250, 240, 230, 210, 200, 190, 180, 170, 165, 175, 185, 195, 200, 195, 180, 170, 160, 150],
          borderColor: '#5694CA',
          backgroundColor: '#5694CA',
          fill: false,
          tension: 0.3,
          pointRadius: 3
        }
      ]
    );
  }


  // Unique clearance requests (single-series, no legend, no subtitle)
  const uniqueEl = document.getElementById('uniqueRequestsChart');
  if (uniqueEl) {
    new Chart(uniqueEl, {
      type: 'line',
      data: {
        labels: [
          '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
          '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
          '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
          '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
        ],
        datasets: [{
          label: 'Unique clearance requests',
          // Shaped to match your screenshot’s pattern (rise to ~14:00 then fall)
          data: [33, 29, 30, 32, 30, 33, 36, 41, 48, 55, 58, 62, 66, 69, 71, 70, 70, 66, 58, 47, 41, 36, 34, 33],
          borderColor: '#5694CA',
          backgroundColor: 'rgba(86,148,202,0.1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: true
        },
        elements: {
          point: {
            hitRadius: 6,
            hoverRadius: 5
          }
        },
        plugins: {
          legend: {
            display: false
          }, // no legend
          tooltip: {
            backgroundColor: '#fff',
            borderColor: '#ccc',
            borderWidth: 1,
            displayColors: false, // single-series, no colour squares
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
              title: (ctx) => `Time: ${ctx[0].label}`,
              label: (ctx) => `Requests: ${ctx.formattedValue}`
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

  // IPAFFS pre-notification CHED types
  const chedEl = document.getElementById('chedTypesChart');
  if (chedEl) {
    new Chart(chedEl, {
      type: 'line',
      data: {
        labels: [
          '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
          '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
          '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
          '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
        ],
        datasets: [
          // CHED P (teal) – dominant series
          {
            label: 'CHED P',
            data: [230, 235, 210, 235, 235, 210, 245, 248, 250, 200, 230, 248, 250, 225, 220, 205, 220, 235, 245, 210, 205, 205, 200, 200],
            borderColor: '#2BA8A3',
            backgroundColor: 'rgba(43,168,163,0.10)',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
            fill: false
          },
          // CHED PP (blue)
          {
            label: 'CHED PP',
            data: [45, 42, 48, 50, 40, 44, 60, 52, 52, 50, 44, 55, 42, 48, 50, 53, 45, 55, 50, 53, 52, 54, 50, 49],
            borderColor: '#5694CA',
            backgroundColor: 'rgba(86,148,202,0.10)',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
            fill: false
          },
          // CHED A (magenta)
          {
            label: 'CHED A',
            data: [8, 14, 12, 10, 7, 11, 9, 12, 9, 15, 7, 12, 10, 9, 11, 10, 11, 10, 8, 14, 9, 10, 12, 13],
            borderColor: '#D81B60',
            backgroundColor: 'rgba(216,27,96,0.10)',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
            fill: false
          },
          // CHED D (orange)
          {
            label: 'CHED D',
            data: [5, 7, 6, 5, 4, 6, 5, 9, 7, 10, 6, 12, 9, 8, 10, 9, 10, 9, 7, 13, 8, 9, 10, 11],
            borderColor: '#F57C00',
            backgroundColor: 'rgba(245,124,0,0.10)',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        // single series per hover (no multi-line tooltip)
        interaction: {
          mode: 'nearest',
          intersect: true
        },

        elements: {
          point: {
            hitRadius: 6,
            hoverRadius: 5
          }
        },

        plugins: {
          legend: {
            display: false
          }, // using your custom key below the chart
          tooltip: {
            backgroundColor: '#fff',
            borderColor: '#ccc',
            borderWidth: 1,
            displayColors: false,
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
              title: (ctx) => `Time: ${ctx[0].label}`,
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