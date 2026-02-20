/*import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';  // For creating temporary files

@Controller('images')
export class ImageControllerr {
  @Post('predicts')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          callback(null, file.originalname);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
    }),
  )
  async predict(@UploadedFile() file) {
    try {
      if (!file) {
        return { error: 'No file uploaded.' };
      }

      const filePath = path.join(__dirname, '..', '..', 'uploads', file.originalname);
      const imageData = fs.readFileSync(filePath);

      // Create a temporary file to store the image
      const tempFilePath = path.join(os.tmpdir(), 'temp_image.jpg');
      fs.writeFileSync(tempFilePath, imageData);  // Write the image to the temp file

      // Resolve the Python script path dynamically
      const pythonScript = path.resolve(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../scripts/predict.py' : '../../src/scripts/predict.py'
      );
      console.log('Resolved Python script path:', pythonScript);

      if (!fs.existsSync(pythonScript)) {
        throw new Error(`Python script not found at path: ${pythonScript}`);
      }

      // Execute the Python script and pass the path to the temporary image file
      const command = `python ${pythonScript} "${tempFilePath}"`;

      const prediction = await new Promise<string>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(`Error: ${stderr || error.message}`);
          }
          resolve(stdout);
        });
      });

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);  // Remove the temporary file after execution

      return { prediction: JSON.parse(prediction) };

    } catch (error) {
      console.error(error);
      return { error: error.message || 'An error occurred while processing the image.' };
    }
  }
}*/

import { Controller, Post, UploadedFile, UseInterceptors, Headers } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';  // For creating temporary files
import { DiagnosisService } from '../diagnosis/diagnosis.service';

@Controller('images')
export class ImageControllerr {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post('predicts')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = `${Date.now()}-${file.originalname}`;
          callback(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
    }),
  )
  async predict(
    @UploadedFile() file,
    @Headers('x-user-id') userId?: string,
  ) {
    try {
      console.log("Received file:", file);  // Log the uploaded file

      if (!file) {
        console.error("No file uploaded.");  // Log when no file is uploaded
        return { error: 'No file uploaded.' };
      }

      // Use the path provided by multer (relative to cwd)
      // In production, file.path will be the correct path set by multer
      const filePath = path.resolve(process.cwd(), file.path);
      console.log("File path:", filePath);  // Log the file path

      // Verify file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at: ${filePath}`);
        throw new Error(`Uploaded file not found at: ${filePath}`);
      }

      const imageData = fs.readFileSync(filePath);
      console.log("Image data read successfully");

      // Create a temporary file to store the image
      const tempFilePath = path.join(os.tmpdir(), 'temp_image.jpg');
      fs.writeFileSync(tempFilePath, imageData);  // Write the image to the temp file
      console.log("Temporary file created at:", tempFilePath);

      // Resolve the Python script path dynamically
      // In production: /app/src/model/predict.py
      // In development: ../../src/model/predict.py
      const pythonScript = process.env.NODE_ENV === 'production' 
        ? '/app/src/model/predict.py'
        : path.resolve(__dirname, '../../src/model/predict.py');
      
      console.log('Resolved Python script path:', pythonScript);
      console.log('NODE_ENV:', process.env.NODE_ENV);

      if (!fs.existsSync(pythonScript)) {
        console.error(`Python script not found at path: ${pythonScript}`);  // Log if the script is not found
        throw new Error(`Python script not found at path: ${pythonScript}`);
      }

      // Use absolute path to python3 - more reliable than relying on PATH
      const pythonPath = 'python3';
      console.log('Using Python at:', pythonPath);
      
      // Ensure Python script runs with UTF-8 encoding by setting the environment variable
      const command = `${pythonPath} "${pythonScript}" "${tempFilePath}"`;

      const prediction = await new Promise<string>((resolve, reject) => {
        const modelPath = process.env.NODE_ENV === 'production' ? '/app/src/model' : path.resolve(__dirname, '../../src/model');
        const env = { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8', 
          MODEL_PATH: modelPath,
          PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
        };
        
        console.log('Executing command:', command);
        console.log('With environment PATH:', env.PATH);
        
        exec(command, { 
          encoding: 'utf8', 
          env,
          shell: '/bin/sh'
        }, (error, stdout, stderr) => {
          if (error) {
            console.error("Python execution error:", error.message);
            console.error("stderr:", stderr);
            console.error("stdout:", stdout);
            reject(`Error: ${stderr || error.message}`);
          }
          console.log("Prediction result:", stdout);
          resolve(stdout);
        });
      });

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);  // Remove the temporary file after execution
      console.log("Temporary file removed");

      // Parse the JSON output
      const predictionData = JSON.parse(prediction);

      // Auto-save diagnosis if userId is provided
      let diagnosisId = null;
      if (userId) {
        try {
          const imageUrl = `uploads/${file.filename}`;
          const savedDiagnosis = await this.diagnosisService.saveDiagnosis(
            userId,
            imageUrl,
            predictionData,
          );
          diagnosisId = (savedDiagnosis as any)._id.toString();
          console.log('Diagnosis saved successfully for user:', userId, 'ID:', diagnosisId);
        } catch (diagnosisError) {
          console.error('Failed to save diagnosis:', diagnosisError.message);
          // Don't fail the request if diagnosis saving fails
        }
      }

      return { 
        prediction: predictionData,
        diagnosisId,
      };

    } catch (error) {
      console.error("Error during image processing:", error);  // Log detailed error information
      return { error: error.message || 'An error occurred while processing the image.' };
    }
  }
}
