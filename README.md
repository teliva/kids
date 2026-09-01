## Setup
- This project has nodejs and npm depedency
1. Install nodeks + npm
2. 
```
npm ci
```
This will restore the project neccessary to run the repository


## Development 
To fire up development environment
```
npm run dev
```


## Added node script to generate a color palette
```
node scripts/generate-color-scale.js "#ADEBB3" brand --mode=muted --write
```

Generates and patches the tokens.css for colors