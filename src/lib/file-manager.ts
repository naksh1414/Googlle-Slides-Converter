/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/file-manager.ts
import fs from "fs/promises";
import path from "path";

export class FileManager {
  private static uploadsDir = path.join(
    process.cwd(),
    "uploads",
    "presentations"
  );
  private static backupsDir = path.join(
    process.cwd(),
    "uploads",
    "presentations",
    "backups"
  );

  /**
   * Initialize directories for file storage
   */
  static async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.backupsDir, { recursive: true });
      console.log("File storage directories initialized");
    } catch (error) {
      console.error("Failed to initialize directories:", error);
      throw error;
    }
  }

  /**
   * Save presentation data to local JSON file
   */
  static async saveToLocal(
    presentationData: any,
    filename: string
  ): Promise<{ filePath: string; backupPath: string }> {
    await this.initializeDirectories();

    const mainPath = path.join(this.uploadsDir, filename);
    const backupPath = path.join(this.backupsDir, `backup_${filename}`);

    // Save main file
    await fs.writeFile(
      mainPath,
      JSON.stringify(presentationData, null, 2),
      "utf-8"
    );

    // Save backup with pretty formatting
    await fs.writeFile(
      backupPath,
      JSON.stringify(presentationData, null, 4),
      "utf-8"
    );

    return { filePath: mainPath, backupPath };
  }

  /**
   * Read presentation from local file
   */
  static async readFromLocal(filename: string): Promise<any> {
    const filePath = path.join(this.uploadsDir, filename);

    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to read file ${filename}:`, error);
      throw new Error(`File not found or corrupted: ${filename}`);
    }
  }

  /**
   * List all presentation files
   */
  static async listPresentations(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.uploadsDir);
      return files.filter(
        (file) => file.endsWith(".json") && !file.startsWith("summary_")
      );
    } catch (error) {
      console.error("Failed to list presentations:", error);
      return [];
    }
  }

  /**
   * Delete presentation files
   */
  static async deletePresentationFiles(filename: string): Promise<void> {
    const mainPath = path.join(this.uploadsDir, filename);
    const backupPath = path.join(this.backupsDir, `backup_${filename}`);
    const summaryPath = path.join(this.uploadsDir, `summary_${filename}`);

    try {
      await fs.unlink(mainPath).catch(() => {});
      await fs.unlink(backupPath).catch(() => {});
      await fs.unlink(summaryPath).catch(() => {});
      console.log(`Deleted files for: ${filename}`);
    } catch (error) {
      console.error(`Failed to delete files for ${filename}:`, error);
    }
  }

  /**
   * Generate a safe filename from title
   */
  static generateFilename(title: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
    return `${safeTitle}_${timestamp}.json`;
  }

  /**
   * Get file stats
   */
  static async getFileStats(filename: string): Promise<any> {
    const filePath = path.join(this.uploadsDir, filename);

    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true,
      };
    } catch (error) {
      console.error(`Failed to get stats for ${filename}:`, error);
      return { exists: false };
    }
  }
}
