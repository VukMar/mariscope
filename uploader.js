// upload.js
import { v2 as cloudinary } from 'cloudinary';
import { logToConsole } from './consoleLogger.js';
import { simplifyName } from './pobNameFix.js';
import fs from 'fs';

export async function uploadImage(config) {

	//Get cloudinary config JSON info
	let clConfig;
	try {
		clConfig = JSON.parse(fs.readFileSync(config.clConfig, 'utf8'));
	} catch (err) {
		console.error(`Failed to read config file at ${config.clConfig}`, err);
		throw err;
	}

	//Apply configuration to cloudinary
	cloudinary.config(clConfig);

	//Apply ststion name and upload the image
	let stationName = await simplifyName(config.selectors.pobName);
  try {
    const result = await cloudinary.uploader.upload(`${config.output.main}/${stationName}/${config.output.renderOut}`, {
      public_id: stationName, 
      overwrite: true, 
	  invalidate: true,       
      resource_type: 'image', 
      folder: 'mariscope',
			fetch_format: 'auto',
			quality: 'auto'
    });

    logToConsole(`Image uploaded successfully: ${result.secure_url}`, config);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}
