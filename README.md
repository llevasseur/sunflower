# Sunflower

## Installation
To install this project, clone the repository from github (or unzip the file if that's how you got it).

Install Node on your computer: https://nodejs.org/en

Migrate to the repository (file) downloaded from github. Open a terminal in this file.

From here, use the terminal to install npm modules:
>: npm install

Run Parcel (packaging framework):

>: npx parcel public/index.html

Open up a web browser and type this in the url:
>: localhost:1234 

## Usage
Simply move the mouse around the scanned mesh (old tank) to grow sunflowers off of the surface where the cursor lies. 

Use the Left Mouse Button to pan.
Use the Right Mouse Button to pinch and move.
Use the Scroll Wheel to zoom.

## Error Handling
1. Parcel Error: Expected content key [...] to exist
   Solution: Delete .parcel-cache, rerun:
   >: npx parcel public/index.html
