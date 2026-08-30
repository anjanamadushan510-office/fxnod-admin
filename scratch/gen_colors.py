colors = [
  ['#ffffff', '#e1e1e1', '#cccccc', '#b7b7b7', '#a0a0a5', '#898989', '#707070', '#626262', '#555555', '#464646', '#363636', '#262626', '#1d1d1d', '#000000'],
  ['#f4977c', '#f7ac84', '#fbc58d', '#fff69e', '#c4de9e', '#85c99e', '#7fcdc7', '#75d0f4', '#81a8d7', '#8594c8', '#8983bc', '#a187bd', '#bb8dbe', '#f29bc1'],
  ['#ef6c53', '#f38d5b', '#f8ae63', '#fff371', '#acd277', '#43b77a', '#2ebbb3', '#00bff0', '#4a8dc8', '#5875b7', '#625da6', '#8561a7', '#a665a7', '#ee6fa9'],
  ['#ea1d2c', '#ee652e', '#f4932f', '#fff126', '#8ec648', '#00a553', '#00a99c', '#00afed', '#0073ba', '#0056a4', '#323390', '#66308f', '#912a8e', '#e9088c'],
  ['#9b0b16', '#9e4117', '#a16118', '#c6b920', '#5a852d', '#007238', '#00746a', '#0077a1', '#004c7f', '#003570', '#1d1762', '#441261', '#62095f', '#9c005d'],
  ['#770001', '#792e03', '#7b4906', '#817a0b', '#41661e', '#005827', '#005951', '#003b5c', '#001d40', '#000e35', '#04002c', '#19002b', '#2c002a', '#580028']
]
html = '<div style="display:grid; grid-template-columns: repeat(14, 20px); gap: 2px;">'
for row in colors:
    for c in row:
        html += f'<div style="width:20px; height:20px; background-color:{c}; border: 1px solid #ddd"></div>'
html += '</div>'
with open('public/colors.html', 'w') as f:
    f.write(html)
