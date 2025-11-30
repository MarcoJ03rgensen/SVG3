# SVG3 Scene Files

Place your custom `.svg3` scene files here.

## Example Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg3>
  <!-- Your SVG3 scene here -->
</svg3>
```

## Loading in HTML

```javascript
const response = await fetch('scenes/your-scene.svg3');
const svgString = await response.text();
const sceneData = parser.parse(svgString);
```