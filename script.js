document.addEventListener('DOMContentLoaded', function() {
  updateUI();
  setupLoginForm();
});

function updateUI() {
  var wrapper = document.querySelector('.wrapper');
  var loginContainer = document.getElementById('login-container');
  if ( sessionStorage.getItem('loginSuccess') !== 'true') {
    loginContainer.style.display = 'flex';
    wrapper.style.display = 'none';
  } else {
    createCards();
    loginContainer.style.display = 'none';
    wrapper.style.display = 'flex';

    const storedFaceId =  sessionStorage.getItem('selectedFaceId') || '1';
    currentFaceId = storedFaceId;
    updateSelectedClasses(storedFaceId);
    rotateCubeToFace(storedFaceId);
    handleFadeEffect(storedFaceId);

    updateFace()
  }
}



document.onmousemove = function(e) {
  // Find all elements with the 'card' class
  var cards = document.querySelectorAll('.card');
  cards.forEach(function(card) {
  var rect = card.getBoundingClientRect(),
    x = e.clientX - rect.left,
    y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });

  // Find the button element
  var loginCard = document.querySelector('.login-card');
  if (loginCard) {
    var rect = loginCard.getBoundingClientRect(),
    x = e.clientX - rect.left,
    y = e.clientY - rect.top;
    loginCard.style.setProperty('--mouse-x', `${x}px`);
    loginCard.style.setProperty('--mouse-y', `${y}px`);
  }
};

// Extract the login form setup to a separate function
function setupLoginForm() {
  var loginContainer = document.getElementById('login-container');
  var loginForm = document.getElementById('login-form');
  var wrapper = document.querySelector('.wrapper');

  // Handle form submission
  loginForm.onsubmit = function(e) {
    e.preventDefault();

    const username = document.querySelector('input[type="text"]').value;
    const password = document.querySelector('input[type="password"]').value;

    const usernameField = document.querySelector('input[type="text"]');
    const passwordField = document.querySelector('input[type="password"]');

    // Encode credentials and make the login request
    fetch('https://01.kood.tech/api/auth/signin', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(username + ':' + password),
      'Content-Type': 'application/json'
    }
    })
    .then(response => {
    if (!response.ok) {
      throw new Error('Login failed with status: ' + response.status);
    } else if (response.ok) {
      sessionStorage.setItem('loginSuccess', 'true');
      loginContainer.style.display = 'none';
      wrapper.style.display = 'flex';
    }
    // Assume the response is just the JWT token text
    return response.text(); // changed from response.json()
    })
    .then(jwt => {
      if (!jwt || jwt.split('.').length !== 3) {
        throw new Error('Invalid JWT token received');
      }
      localStorage.setItem('token', jwt);
      sessionStorage.setItem('selectedFaceId', "1")
      fetchProfileData(jwt)
      createCards()
    })
    .catch(error => {
      console.error('Error logging in:', error);
      alert('Invalid credentials. Please try again');

      usernameField.value = '';
      passwordField.value = '';
    });
  };
}

function fetchProfileData(jwt) {
  const token = jwt.replace(/^"|"$/g, '');
  const query = `
  {
    user {
      id
      login
      attrs
      totalUp
      totalDown
      createdAt
      updatedAt
      transactions(order_by: { createdAt: asc }) {
        id
        createdAt	
        objectId
        type
        amount
        path
        object {
          id
          name
          type
          attrs
        }
      }
    }
  }`;

  fetch('https://01.kood.tech/api/graphql-engine/v1/graphql', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: query })
  })
  .then(response => {
  if (!response.ok) {
    throw new Error('Fetching profile data failed');
  }
  return response.json();
  })
  .then(data => {
    const user = data.data.user[0];
    // Process and store the level and last project in sessionStorage
    const processedData = processUserData(user);
    sessionStorage.setItem('userData', JSON.stringify(processedData));

    updateFace()
  })
  .catch(error => {
    console.error('Error fetching profile data:', error);
  });
}

function renderCubeFaces(data) {
  const selectedFaceId = sessionStorage.getItem('selectedFaceId') || '1';

  // Call the render function for the selected face only
  switch (selectedFaceId) {
  case '1':
    renderUserFace(data);
    break;
  case '2':
    renderXpProgressFace(data);
    break;
  case '3':
    renderAuditDataFace(data);
    break;
  case '4':
    renderProjectsFace(data);
    break;
  default:
    console.error('Invalid face ID:', selectedFaceId);
    break;
  }
}

function processUserData(user) {
  // Your logic to process the user's data, calculate level, last project, etc.
  let level = 0;
  let lastProjectName = '';

  // Iterate through transactions to determine level and last project
  user.transactions.forEach(transaction => {
    if (transaction.type === "level") {
      level = Math.max(level, transaction.amount);
    }
    if (transaction.type === "xp") {
      lastProjectName = transaction.object.name;
    }
  });

  // Add level and lastProjectName to the user object
  user.level = level;
  user.lastProjectName = lastProjectName;

  return user; // Return the processed user data
}

function renderUserFace(userData) {
  // Clear existing content
  const userFace = document.getElementById('userFace');
  userFace.innerHTML = '';

  // Create the main container for the card
  const card = document.createElement('div');
  card.classList.add('card2');

  // Add touch elements for styling
  for (let i = 1; i <= 9; i++) {
    if (i === 5) continue;
    const touch = document.createElement('div');
    touch.classList.add('touch', `touch__${i}`);
    card.appendChild(touch);
  }

  // Create the main content section
  const main = document.createElement('div');
  main.classList.add('main');

  // User avatar
  const icon = document.createElement('div');
  icon.classList.add('icon');
  const avatar = document.createElement('img');
  avatar.classList.add('img');
  avatar.src = userData.attrs.image || 'default-avatar.png';
  avatar.alt = 'User Avatar';
  icon.appendChild(avatar);
  main.appendChild(icon);


  // User full name
  const fullName = document.createElement('span');
  fullName.classList.add('name');
  fullName.textContent = `${userData.attrs.firstName} ${userData.attrs.lastName}`;
  main.appendChild(fullName);

  const level = document.createElement('span');
  level.classList.add('account');
  level.textContent = `Level: ${userData.level}`;
  main.appendChild(level);

  // Gender
  const gender = document.createElement('span');
  gender.classList.add('account');
  gender.textContent = `Gender: ${userData.attrs.gender}`;
  main.appendChild(gender);

  // Username
  const username = document.createElement('span');
  username.classList.add('account');
  username.textContent = `Username: ${userData.login}`;
  main.appendChild(username);

  // Nationality
  const nationality = document.createElement('span');
  nationality.classList.add('account');
  nationality.textContent = `Nationality: ${userData.attrs.nationality}`;
  main.appendChild(nationality);

  // Created date
  const createdAt = document.createElement('span');
  createdAt.classList.add('account');
  createdAt.textContent = `Created at: ${new Date(userData.createdAt).toLocaleDateString()}`;
  main.appendChild(createdAt);

  // Email
  const email = document.createElement('span');
  email.classList.add('account');
  email.textContent = `Email: ${userData.attrs.email}`;
  main.appendChild(email);

  const lastProj = document.createElement('span');
  lastProj.classList.add('account');
  lastProj.textContent = `Last Project: ${userData.lastProjectName}`;
  main.appendChild(lastProj);

  // Append main content to the card
  card.appendChild(main);

  // Append the card to the user face
  userFace.appendChild(card);
}

function renderXpProgressFace(userData) {

  // Data processing
  let progressionData = userData.transactions
  .filter(t => t.type === "xp" && !t.path.includes("piscine"))
  .map(t => {
    return {
      x: new Date(t.createdAt), // The x value needs to be a date
      y: t.amount / 1000 // Convert amount to kilobytes or appropriate unit
    };
  });

  // Sort data by date
  progressionData.sort((a, b) => a.x - b.x);

  // Calculate cumulative sum for progression
  let cumulativeSum = 0;
  progressionData = progressionData.map(dataPoint => {
    cumulativeSum += dataPoint.y; // Keep adding value to cumulative sum
    return {
      x: dataPoint.x,
      y: cumulativeSum
    };
  });

  // Initialize the Highcharts chart
  Highcharts.chart('xpProgress', {
    chart: {
      type: 'line',
      backgroundColor: '#2a2a2b' // Dark background
    },
    title: {
      text: 'XP Progression',
      style: {
        color: '#FFF'
      }
    },
    xAxis: {
      type: 'datetime',
      labels: {
        style: {
          color: '#FFF'
        }
      }
    },
    yAxis: {
      title: {
        text: 'XP (kB)',
        style: {
          color: '#FFF'
        }
      },
      labels: {
        style: {
          color: '#FFF'
        }
      }
    },
    exporting: {
      buttons: {
        contextButton: {
          symbol: 'menu',
          symbolStroke: '#ffffff',
          symbolStrokeWidth: 2,
          theme: {
            fill: 'transparent', // Normal state background
            stroke: '#adadad',
            states: {
              hover: {
                fill: 'transparent', // Hover state background
                stroke: '#ffffff',
              },
              select: {
                fill: 'transparent', // Selected state background
                stroke: '#ffffff'
              }
            }
          }
        }
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      series: {
        label: {
          connectorAllowed: false
        },
        pointStart: progressionData[0].x,
        animation: {
      duration: 4000
    },
    events: {
      afterAnimate: function() {
        this.chart.reflow(); // This forces the chart to reflow after the animation completes
      }
    }
      }
    },
    series: [{
      name: 'XP',
      data: progressionData,
      color: '#FFD700' // Color for the line
    }],
    tooltip: {
      headerFormat: '<b>{series.name}</b><br>',
      pointFormat: '{point.x:%e. %b}: {point.y:.2f} kB'
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 500
        },
        chartOptions: {
          legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
          }
        }
      }]
    }
  });
}

function renderAuditDataFace(userData) {
  // Process the audit data to calculate total done and received XP
  let totalDoneXP = 0;
  let totalReceivedXP = 0;
  userData.transactions.forEach(transaction => {
    if (transaction.type === 'up') totalDoneXP += transaction.amount;
    if (transaction.type === 'down') totalReceivedXP += transaction.amount;
  });

  // Convert XP to megabytes (assuming XP is in kilobytes)
  const doneXPMB = totalDoneXP / 1000000;
  const receivedXPMB = totalReceivedXP / 1000000;
  const maxBarWidth = 600; 
  let doneBarWidth = maxBarWidth;
  let receivedBarWidth = maxBarWidth;

  // Calculate the ratio
  const ratio = doneXPMB / receivedXPMB;

  if (doneXPMB > receivedXPMB) {
    receivedBarWidth = maxBarWidth / ratio;
  } else if (doneXPMB < receivedXPMB) {
    doneBarWidth = maxBarWidth / ratio; 
  }

  // Create SVG bar for "Done"
  const doneBarSvg = `<svg width="100%"height="30"><line stroke="#FFD700" stroke-width="12" x1="0"  x2="${doneBarWidth}" y1="15" y2="15" stroke-linecap="round"></line></svg>`;

  // Create SVG bar for "Received"
  const receivedBarSvg = `<svg width="100%" height="30"><line stroke="#A9A9A9" stroke-width="12" x1="0" x2="${receivedBarWidth}" y1="15" y2="15" stroke-linecap="round"></line></svg>`;

  // Combine everything into a single HTML string
  const auditHtml = `
  <div class="audit-container">
    <div class="audit-title">Audit Data</div>
    <div class="audit-bars">
      <div class="audit-bars-container">
        <div class="audit-done-bar">${doneBarSvg}</div>
        <div class="audit-received-bar">${receivedBarSvg}</div>
      </div>
      <div class="audit-info">
        <div class="audit-done-info">Done: ${doneXPMB.toFixed(2)} MB</div>
        <div class="audit-received-info">Gained: ${receivedXPMB.toFixed(2)} MB</div>
      </div>
    </div>
    <div class="audit-ratio">
      ${ratio.toFixed(1)}
      <div class="audit-message">You can do better!</div></div>
  </div>
  `;

  const container = document.getElementById('auditData');
  container.innerHTML = auditHtml;
}

function renderProjectsFace(userData) {

  (function (H) {
  H.seriesTypes.pie.prototype.animate = function (init) {
  const series = this,
    chart = series.chart,
    points = series.points,
    animation = series.options.animation,
    startAngleRad = series.startAngleRad;

  function fanAnimate(point, startAngleRad) {
    const graphic = point.graphic,
      args = point.shapeArgs;

    if (graphic && args) {
    graphic
        .attr({
          start: startAngleRad,
          end: startAngleRad,
          opacity: 1
        })
        .animate({
          start: args.start,
          end: args.end
        }, {
            duration: animation.duration / points.length
        }, function () {
          if (points[point.index + 1]) {
              fanAnimate(points[point.index + 1], args.end);
          }
          if (point.index === points.length - 1) {
            // No need to animate dataLabelsGroup as we are not using data labels
            points.forEach(point => {
                point.opacity = 1;
            });
            series.update({
                enableMouseTracking: true
            }, false);
            chart.update({
              plotOptions: {
                pie: {
                  innerSize: '50%', // The inner circle size
                  borderRadius: 12  // The border radius for the slices
                }
              }
            });
          }
        });
      }
    }

    if (init) {
        points.forEach(point => {
            point.opacity = 0;
        });
    } else {
        fanAnimate(points[0], startAngleRad);
    }
  };
  }(Highcharts));

  const highchartsColors = [
  '#003F5C', // Deep Blue
  '#FFC75F', // Bright Yellow
  '#4CAF50', // Soft Green
  '#9F5F80', // Pastel Purple
  '#F9E2AF', // Light Peach
  '#C34A36', // Rust Red
  '#6A4C93', // Deep Purple
  '#FF6F91', // Soft Pink
  '#F5D042', // Vibrant Yellow
  '#30BFBF', // Teal
  '#8D9440', // Olive Green
  '#8A817C', // Warm Grey
  '#005377', // Darker Blue
  '#FFD580', // Lighter Yellow
  '#66BB6A', // Light Green
  '#B5838D', // Soft Mauve
  '#FFE5B4', // Pale Peach
  '#D56F3E', // Burnt Orange
  '#7B5E7B', // Muted Purple
  '#FF8FA3', // Brighter Pink
  '#F9E076', // Sunny Yellow
  '#40C9C9', // Bright Teal
  '#9CAE7E', // Sage Green
  '#9D9181'  // Dusty Grey
  ]

  const filteredTransactions = userData.transactions
  .filter(transaction => transaction.type === "xp" && !transaction.path.includes("piscine"));
  const totalXP = filteredTransactions
  .reduce((acc, transaction) => acc + transaction.amount / 1000, 0);
  const totalProjects = filteredTransactions.length; // Count total projects

  // Generate chart data with gradient colors
  var chartData = userData.transactions
  .filter(transaction => transaction.type === "xp" && !transaction.path.includes("piscine"))
  .map((transaction, index) => {
    const color = highchartsColors[index % highchartsColors.length];
    return {
      name: transaction.object.name,
      y: transaction.amount / 1000,
      color: {
        radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
        stops: [
          [0, Highcharts.color(color).brighten(0.1).get('rgb')],
          [1, Highcharts.color(color).brighten(-0.3).get('rgb')]
        ]
      }
    };
  });

  // Initialize the Highcharts chart
  Highcharts.chart('projects', {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent'
    },
    title: {
      text: 'Completed Projects',
      x: -90, // Adjust to move the title up or down
      style: {
        fontWeight: 'normal',
        fontSize: '35px',
        color: '#fff'
      }
    },
    subtitle: {
      text: '(Excluding Piscines)',
      x: -90, // Adjust to move the subtitle up or down
      style: {
        color: '#fff'
      }
    },
    tooltip: {
      style: {
        fontSize: '18px', // Increase font size
        padding: '15px' // Increase padding
      },
      pointFormatter: function() { // Custom formatter for tooltip
        const point = this;
        const percent = (point.y / totalXP * 100).toFixed(1); // Calculate the percentage
        return `${point.name}: <b>${point.y.toFixed(1)} XP (${percent}%)</b>`;
      }
    },
    plotOptions: {
        pie: {
          allowPointSelect: true,
          borderWidth: 4,
          borderColor: '#2a2a2b',
          cursor: 'pointer',
          innerSize: '20%',
          borderRadius: 0,
          dataLabels: {
            enabled: false
          },
          showInLegend: true 
        }
    },
    exporting: {
      buttons: {
        contextButton: {
          symbol: 'menu',
          symbolStroke: '#ffffff',
          symbolStrokeWidth: 2,
          theme: {
            fill: 'transparent', // Normal state background
            stroke: '#adadad',
            states: {
              hover: {
                fill: 'transparent', // Hover state background
                stroke: '#ffffff',
              },
              select: {
                fill: 'transparent', // Selected state background
                stroke: '#ffffff'
              }
            }
          },
          align: 'right',
          verticalAlign: 'top',
          x: -30,
          y: 10
        }
      }
    },
    legend: {
      title: {
        text: `<span style="color: white;">Total Projects: ${totalProjects}</span><br><br>` +`<span style="color: white;">Total XP: ${totalXP.toFixed(1)}kB</span>`,
        style: {
          color: 'white',
          fontSize: '16px'
        }
      },
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
      itemStyle: {
        color: 'white',
        fontSize: '14px'
      }
    },
    series: [{
      enableMouseTracking: false,
      animation: {
        duration: 2000
      },
      colorByPoint: true,
      data: chartData
    }],
    colors: highchartsColors
  });
}




function createCards() {
  const cardsData = [
    { title: 'Projects', index: '4', imageUrl: '/graphql/assets/Projects.webp' },
    { title: 'Audit Data', index: '3', imageUrl: '/graphql/assets/Audit.webp' },
    { title: 'XP Progression', index: '2', imageUrl: '/graphql/assets/XP.webp' },
    { title: 'User Information', index: '1', imageUrl: '/graphql/assets/UserInfo.webp' }
  ];
  const cardContainer = document.getElementById('cards');

  cardsData.forEach(cardData => {
  const card = document.createElement('div');
  card.classList.add('card');
  card.setAttribute('data-face-id', cardData.index);

  const imageContainer = document.createElement('div');
  imageContainer.classList.add('card-image-container');
  const image = document.createElement('img');
  image.src = cardData.imageUrl;
  image.alt = cardData.title + ' image';
  image.classList.add('card-image');
  imageContainer.appendChild(image);

  const titleElement = document.createElement('h3');
  titleElement.classList.add('card-title');
  titleElement.textContent = cardData.title;

  const textContent = document.createElement('div');
  textContent.classList.add('card-text-content');
  textContent.appendChild(titleElement);

  const cardContent = document.createElement('div');
  cardContent.classList.add('card-content');

  cardContent.appendChild(imageContainer);
  cardContent.appendChild(textContent);
  card.appendChild(cardContent);

  card.addEventListener('click', () => {
    rotateCube(cardData.index, cardData.title);
  });


  cardContainer.prepend(card);
  });

  const storedFaceId =  sessionStorage.getItem('selectedFaceId') || '1';
  const selectedCard = document.querySelector(`.card[data-face-id="${storedFaceId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('card--selected');
  }
}

let currentFaceId = '1'; // Start at face 1
const rotationStep = 90; // Assuming 90 degrees for each face rotation

// Rotation variations mapping
const rotationMap = {
  '1': {
  '2': { direction: -1, steps: 1 },
  '3': { direction: -1, steps: 2 },
  '4': { direction: 1,  steps: 1 },
  },
  '2': {
  '1': { direction: 1,  steps: 1 },
  '3': { direction: -1, steps: 1 },
  '4': { direction: 1,  steps: 2 },
  },
  '3': {
  '1': { direction: 1,  steps: 2 },
  '2': { direction: 1,  steps: 1 },
  '4': { direction: -1, steps: 1 },
  },
  '4': {
  '1': { direction: -1, steps: 1 },
  '2': { direction: 1,  steps: 2 },
  '3': { direction: 1,  steps: 1 },
  }
};

const oppositeFaces = {
  '1': '3',
  '2': '4',
  '3': '1',
  '4': '2'
};

function rotateCube(targetFaceId, card) {

  const cube = document.querySelector('.cube');

  const targetId = targetFaceId.toString();

  // Check if the rotation is necessary
  if (currentFaceId === targetId) {
    return;
  }

  const rotationInfo = rotationMap[currentFaceId][targetId];
  const totalRotation = rotationInfo.direction * rotationStep * rotationInfo.steps;

  cube.style.transform += `rotateX(${totalRotation}deg)`;
  currentFaceId = targetId;

  updateSelectedClasses(targetId);

  sessionStorage.setItem('selectedFaceId', targetFaceId);
  updateFace();

}

function handleFadeEffect(faceId) {
  // Find the image and data elements of the current face
  const currentFace = document.getElementById(faceId);
  const image = currentFace.querySelector('.face-image');
  const data = currentFace.querySelector('.face-data');

  // Set a timeout to allow the cube to finish rotating before starting the fade effect
  setTimeout(() => {
    if (image && data) {
      image.style.opacity = 0; // Fade out the image
      data.style.opacity = 1; // Fade in the data
    }
  }, 1000); // Adjust this timeout to match the duration of your cube rotation
}

function updateSelectedClasses(targetFaceId) {

  // Reset the fade effect for all faces
  document.querySelectorAll('.cube__face').forEach(face => {
  const image = face.querySelector('.face-image');
  const data = face.querySelector('.face-data');
  if (image && data) {
    image.style.opacity = 1; // Reset image to visible
    data.style.opacity = 0; // Reset data to hidden
  }
  });

  // Apply the fade effect to the newly selected face
  handleFadeEffect(targetFaceId);

  // Hide all cover divs by removing the visible class
  document.querySelectorAll('.cube__face--cover').forEach(el => {
  el.classList.remove('cube__face--cover--visible');
  });

  // Remove existing selected classes
  document.querySelectorAll('.cube__face--selected').forEach(el => el.classList.remove('cube__face--selected'));
  document.querySelectorAll('.card--selected').forEach(el => el.classList.remove('card--selected'));

  // Add new selected classes
  const selectedFace = document.getElementById(targetFaceId);
  selectedFace.classList.add('cube__face--selected');

  // Show the cover div on the selected face by adding the visible class
  const coverDiv = selectedFace.querySelector('.cube__face--cover');
  if (coverDiv) {
  setTimeout(() => {
    coverDiv.classList.add('cube__face--cover--visible');
  }, 50); // A short delay to ensure the transition effect is applied
  }

  const selectedCard = document.querySelector(`.card[data-face-id="${targetFaceId}"]`);
  selectedCard.classList.add('card--selected');
}

function rotateCubeToFace(faceId) {
  const cube = document.querySelector('.cube');
  const faceRotationMap = { '1': 0, '2': -90, '3': -180, '4': -270 };
  const rotationDegrees = faceRotationMap[faceId] || 0;
  cube.style.transform = `rotateX(${rotationDegrees}deg)`;
}

function calculateTransitionDuration(steps) {
  const baseDuration = 500; // Base duration for one step
  return Math.abs(steps) * baseDuration;
}

function updateFace() {
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  if (userData) {
  renderCubeFaces(userData);
  }
}

function logout() {
  // Clear token and set loginSuccess to false in localStorage
  localStorage.removeItem('token');
  sessionStorage.setItem('loginSuccess', 'false');

  // Clear userData in sessionStorage
  sessionStorage.removeItem('userData');
  window.location.reload();
}