import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
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
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async predict(@UploadedFile() file, @Headers('x-user-id') userId?: string) {
    try {
      console.log('Received file:', file);

      if (!file) {
        console.error('No file uploaded.');
        return { error: 'No file uploaded.' };
      }

      const filePath = path.resolve(process.cwd(), file.path);
      console.log('File path:', filePath);

      if (!fs.existsSync(filePath)) {
        console.error(`File not found at: ${filePath}`);
        throw new Error(`Uploaded file not found at: ${filePath}`);
      }

      const imageData = fs.readFileSync(filePath);
      console.log('Image data read successfully');

      const tempFilePath = path.join(os.tmpdir(), 'temp_image.jpg');
      fs.writeFileSync(tempFilePath, imageData);
      console.log('Temporary file created at:', tempFilePath);

      // Determine if running in production (Render) or development
      const isProduction = process.env.NODE_ENV === 'production';
      const isWindows = process.platform === 'win32';

      // Python script path
      const pythonScript = isProduction
        ? '/app/src/model/predict.py'  // Render path
        : path.resolve(__dirname, '..', '..', 'src', 'model', 'predict.py');

      console.log('Resolved Python script path:', pythonScript);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('Platform:', process.platform);

      if (!fs.existsSync(pythonScript)) {
        console.error(`Python script not found at path: ${pythonScript}`);
        throw new Error(`Python script not found at path: ${pythonScript}`);
      }

      // FIX: Determine Python executable path based on environment
      let pythonExecutable: string;
      
      if (isProduction) {
        // Render/Linux production - use the venv path from Docker
        pythonExecutable = '/opt/venv/bin/python';
      } else {
        // Development environment
        if (isWindows) {
          // Windows development
          pythonExecutable = path.resolve(
            __dirname,
            '..',
            '..',
            'venv',
            'Scripts',
            'python.exe'
          );
        } else {
          // Linux/Mac development
          pythonExecutable = 'python3';
        }
      }

      console.log('Using Python executable:', pythonExecutable);

      // Model path
      const modelPath = isProduction
        ? '/app/src/model'
        : path.resolve(__dirname, '..', '..', 'src', 'model');

      const modelFile = path.join(modelPath, 'final_model.keras');
      console.log('Looking for model at:', modelFile);

      // Build command
      const command = `"${pythonExecutable}" "${pythonScript}" "${tempFilePath}"`;
      console.log('Executing command:', command);

      const prediction = await new Promise<string>((resolve, reject) => {
        const env = {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          MODEL_PATH: modelPath,
        };

        exec(
          command,
          {
            encoding: 'utf8',
            env,
          },
          (error, stdout, stderr) => {
            if (error) {
              console.error('Python execution error:', error.message);
              console.error('stderr:', stderr);
              console.error('stdout:', stdout);
              reject(`Error: ${stderr || error.message}`);
            }
            console.log('Prediction result:', stdout);
            resolve(stdout);
          },
        );
      });

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
      console.log('Temporary file removed');

      console.log('RAW Python output:', prediction);
      
      try {
        const predictionData = JSON.parse(prediction);
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
            console.log(
              'Diagnosis saved successfully for user:',
              userId,
              'ID:',
              diagnosisId,
            );
          } catch (diagnosisError) {
            const errorMessage =
              diagnosisError instanceof Error
                ? diagnosisError.message
                : String(diagnosisError);
            console.error('Failed to save diagnosis:', errorMessage);
          }
        }

        return {
          prediction: predictionData,
          diagnosisId,
        };
      } catch (err) {
        console.error('JSON parse error:', err, 'Python output:', prediction);
        throw err;
      }

    } catch (error) {
      console.error('Error during image processing:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        error: errorMessage || 'An error occurred while processing the image.',
      };
    }
  }
}