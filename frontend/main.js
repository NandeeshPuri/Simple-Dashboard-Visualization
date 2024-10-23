document.addEventListener("DOMContentLoaded", function () {
    let globalData = [];

    // Function to fetch data from the backend
    function fetchData() {
        fetch('http://127.0.0.1:5000/api/data')
            .then(response => response.json())
            .then(data => {
                globalData = data; 
                renderVisualization(globalData); 
                populateFilters(globalData); // Populate filters with data
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // Function to populate filters with unique values from the data
    function populateFilters(data) {
        const filters = [
            'endYearFilter',
            'topicFilter',
            'sectorFilter',
            'regionFilter',
            'pestFilter',
            'sourceFilter',
            'countryFilter',
           
        ];

        filters.forEach(filter => {
            const selectElement = document.getElementById(filter);
            selectElement.innerHTML = ''; 

            
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.text = 'All';
            selectElement.appendChild(allOption);

            // Populate with unique values related to the filter
            let filterKey = filter.replace('Filter', ''); 
            if (filterKey === 'endYear') filterKey = 'end_year'; 
            if (filterKey === 'pest') filterKey = 'pestle'; 
            const uniqueValues = [...new Set(data.map(item => item[filterKey]))].filter(Boolean); 
            if (filterKey === 'end_year') uniqueValues.sort((a, b) => a - b); // Sort end year values
            uniqueValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.text = value;
                selectElement.appendChild(option);
            });
        });
    }

    // Add event listeners to filters
    const filters = [
        'endYearFilter',
        'topicFilter',
        'sectorFilter',
        'regionFilter',
        'pestFilter',
        'sourceFilter',
        'countryFilter',
    ];

    // Add event listeners to filters
    filters.forEach(filter => {
        document.getElementById(filter).addEventListener('change', filterData);
    });

    // Function to filter data based on selected filters
    function filterData() {
        const selectedFilters = {};
        filters.forEach(filter => {
            const value = document.getElementById(filter).value;
            selectedFilters[filter.replace('Filter', '')] = value;
        });

        let filteredData = globalData;

        // Filter data based on selected end year
        if (selectedFilters.endYear !== '') {
            filteredData = filteredData.filter(item => item.end_year === parseInt(selectedFilters.endYear));
        }

        // Filter data based on selected pest
        if (selectedFilters.pest !== '') {
            filteredData = filteredData.filter(item => item.pestle === selectedFilters.pest);
        }

        // Filter data based on other selected filters
        filteredData = filteredData.filter(item => {
            return Object.keys(selectedFilters).every(key => {
                const filterValue = selectedFilters[key];
                if (key === 'endYear' || key === 'pest') return true; // Skip end year and pest filters
                return filterValue === '' || item[key] === filterValue;
            });
        });

        renderVisualization(filteredData);
    }
    
    function renderBarChart(data) {
        document.getElementById('barChart').innerHTML = '';
    
        // Filter out data points where country is null
        const filteredData = data.filter(d => d.country !== null);
    
        // Prepare data for bar chart
        const intensityData = filteredData.map(d => ({ intensity: d.intensity, country: d.country }));
    
        // Set up the dimensions of the canvas
        const svgWidth = 800;
        const svgHeight = 400;
        const margin = { top: 20, right: 20, bottom: 50, left: 60 };
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;
    
        // Create SVG element
        const svg = d3.select('#barChart')
            .append('svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);
    
        // Create scales
        const xScale = d3.scaleBand()
            .domain(intensityData.map(d => d.country))
            .range([margin.left, width + margin.left])
            .padding(0.1);
    
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(intensityData, d => d.intensity)])
            .range([height, 0]);
    
        // Add bars to the chart
        svg.selectAll('rect')
            .data(intensityData)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.country))
            .attr('y', d => yScale(d.intensity))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.intensity))
            .attr('fill', 'steelblue');
    
        // Add x-axis with rotated labels and smaller font size
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-60)') 
            .attr('dx', '-0.8em')
            .attr('dy', '0.15em')
            .style('font-size', '10px'); 
    
        // Add y-axis
        svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '-3em')
            .attr('text-anchor', 'end')
            .text('Intensity');
    
        // Add chart title
        svg.append('text')
            .attr('x', svgWidth / 2)
            .attr('y', margin.top / 2 + 10) 
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .text('Bar Chart - Intensity by Country');
    }
    

// Function to render line chart
function renderLineChart(data) {
    document.getElementById('lineChart').innerHTML = '';

    // Filter out data points with missing or invalid likelihood and intensity values
    const filteredData = data.filter(d => !isNaN(d.intensity) && !isNaN(d.likelihood));

    // Prepare data for line chart
    const lineData = filteredData.map(d => {
        const intensity = +d.intensity;
        const likelihood = +d.likelihood;
        return { intensity, likelihood };
    });

    // Set up the dimensions of the canvas
    const svgWidth = 800;
    const svgHeight = 800;
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select('#lineChart')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain([0, lineData.length - 1])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, Math.max(d3.max(lineData, d => d.intensity), d3.max(lineData, d => d.likelihood))])
        .range([height, 0]);

    // Define the line functions
    const intensityLine = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.intensity));

    const likelihoodLine = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.likelihood));

    // Add intensity line
    svg.append('path')
        .datum(lineData)
        .attr('class', 'line')
        .style('stroke', 'steelblue')
        .attr('d', intensityLine);

    // Add likelihood line
    svg.append('path')
        .datum(lineData)
        .attr('class', 'line')
        .style('stroke', 'green')
        .attr('d', likelihoodLine);

    // Add x-axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    // Add y-axis
    svg.append('g')
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 20)
        .style('text-anchor', 'middle')
        .text('Data Points');

    // Add y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', 0 - height / 2)
        .attr('y', 0 - margin.left)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Value');

    // Add chart title
    svg.append('text')
        .attr('x', svgWidth / 2)
        .attr('y', margin.top / 2 + 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .text('Line Chart - Intensity vs Likelihood');
}

    // Function to render verticalbar chart
    function renderBarChart2(data) {
        document.getElementById('barChart2').innerHTML = '';
    
        // Prepare data for bar chart
        const barData = data.map(d => ({ likelihood: d.likelihood, relevance: d.relevance }));
    
        // Set up the dimensions of the canvas
        const svgWidth = 800; 
        const svgHeight = 400; 
        const margin = { top: 20, right: 20, bottom: 50, left: 60 };
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;
    
        // Create SVG element
        const svg = d3.select('#barChart2')
            .append('svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);
    
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(barData, d => d.relevance)])
            .range([margin.left, width + margin.left]);
    
        const yScale = d3.scaleBand()
            .domain(barData.map(d => d.likelihood))
            .range([height, margin.top])
            .padding(0.1);
    
        // Add bars to the chart
        svg.selectAll('rect')
            .data(barData)
            .enter()
            .append('rect')
            .attr('x', margin.left)
            .attr('y', d => yScale(d.likelihood))
            .attr('width', d => xScale(d.relevance) - margin.left)
            .attr('height', yScale.bandwidth())
            .attr('fill', 'steelblue');
    
        // Add y-axis
        svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));
    
        // Add x-axis
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));
    
        // Add y-axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', 0 - height / 2)
            .attr('y', margin.left - 40)
            .style('text-anchor', 'middle')
            .text('Likelihood');
    
        // Add x-axis label
        svg.append('text')
            .attr('x', width / 2 + margin.left)
            .attr('y', height + margin.top + 20)
            .style('text-anchor', 'middle')
            .text('Relevance');
    
        // Add chart title
        svg.append('text')
            .attr('x', svgWidth / 2)
            .attr('y', margin.top / 2+10)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .text('Bar Chart - Likelihood vs Relevance');
    }
    

// Function to render map chart
function renderMapChart(data) {
    document.getElementById('mapChart').innerHTML = '';

    // Prepare data for map chart
    const countryData = data.reduce((acc, cur) => {
        acc[cur.country] = (acc[cur.country] || 0) + 1;
        return acc;
    }, {});

    // Set up the dimensions of the canvas
    const svgWidth = 800;
    const svgHeight = 500;
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select('#mapChart')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight);

    // Load and render the world map
    d3.json('world.json').then(world => {
        // Prepare data for map chart
        const mapData = world.features.map(d => {
            const country = d.properties.name;
            const count = countryData[country] || 0;
            return { country, count };
        });

        // Define color scale
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(mapData, d => d.count)]);

        // Define a projection
        const projection = d3.geoNaturalEarth1()
            .scale(width / 2 / Math.PI)
            .translate([width / 2, height / 2]);

        // Define a path generator
        const path = d3.geoPath()
            .projection(projection);

        // Bind data to the paths and render
        svg.selectAll('path')
            .data(world.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => {
                const countryData = mapData.find(item => item.country === d.properties.name);
                return countryData ? colorScale(countryData.count) : '#ccc';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
    });

    // Add chart title
    svg.append('text')
        .attr('x', svgWidth / 2)
        .attr('y', margin.top)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .text('Map Chart - Distribution by Country');
}


    // Function to render visualization based on data
    function renderVisualization(data) {
        renderBarChart(data); // Render bar chart
        renderLineChart(data); // Render line chart
        renderBarChart2(data); // Render scatter plot
        renderMapChart(data); // Render pie chart
        
    }

    // Initial data fetch and rendering
    fetchData();
});
