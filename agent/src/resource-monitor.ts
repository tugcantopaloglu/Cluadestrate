import * as si from "systeminformation";
import * as os from "os";
import { ResourceInfo } from "./types";
import { getLogger } from "./logger";

export class ResourceMonitor {
  private lastNetworkStats: { rx: number; tx: number; time: number } | null = null;

  async getResources(): Promise<ResourceInfo> {
    const logger = getLogger();

    try {
      const [cpu, mem, disk, networkStats] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
      ]);

      // Calculate network speed
      const totalNetwork = networkStats.reduce(
        (acc, iface) => ({
          rx: acc.rx + iface.rx_bytes,
          tx: acc.tx + iface.tx_bytes,
        }),
        { rx: 0, tx: 0 }
      );

      let networkRx = 0;
      let networkTx = 0;

      if (this.lastNetworkStats) {
        const timeDiff = (Date.now() - this.lastNetworkStats.time) / 1000;
        networkRx = (totalNetwork.rx - this.lastNetworkStats.rx) / timeDiff;
        networkTx = (totalNetwork.tx - this.lastNetworkStats.tx) / timeDiff;
      }

      this.lastNetworkStats = {
        rx: totalNetwork.rx,
        tx: totalNetwork.tx,
        time: Date.now(),
      };

      // Get primary disk (usually the one with most space or root)
      const primaryDisk = disk.find((d) => d.mount === "/" || d.mount === "C:\\") || disk[0];

      return {
        cpuPercent: Math.round(cpu.currentLoad * 100) / 100,
        memoryPercent: Math.round((mem.used / mem.total) * 10000) / 100,
        memoryUsed: mem.used,
        memoryTotal: mem.total,
        diskPercent: primaryDisk
          ? Math.round((primaryDisk.used / primaryDisk.size) * 10000) / 100
          : 0,
        diskUsed: primaryDisk?.used || 0,
        diskTotal: primaryDisk?.size || 0,
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        networkRx: Math.round(networkRx),
        networkTx: Math.round(networkTx),
      };
    } catch (error) {
      logger.error(`Failed to get system resources: ${(error as Error).message}`);

      // Return basic info using os module as fallback
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      return {
        cpuPercent: 0,
        memoryPercent: Math.round((usedMem / totalMem) * 10000) / 100,
        memoryUsed: usedMem,
        memoryTotal: totalMem,
        diskPercent: 0,
        diskUsed: 0,
        diskTotal: 0,
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        networkRx: 0,
        networkTx: 0,
      };
    }
  }

  async getSystemInfo(): Promise<{
    platform: string;
    arch: string;
    hostname: string;
    osVersion: string;
    cpuModel: string;
    cpuCores: number;
  }> {
    try {
      const [osInfo, cpuInfo] = await Promise.all([si.osInfo(), si.cpu()]);

      return {
        platform: process.platform,
        arch: process.arch,
        hostname: os.hostname(),
        osVersion: `${osInfo.distro} ${osInfo.release}`,
        cpuModel: cpuInfo.brand,
        cpuCores: cpuInfo.cores,
      };
    } catch (error) {
      return {
        platform: process.platform,
        arch: process.arch,
        hostname: os.hostname(),
        osVersion: `${os.type()} ${os.release()}`,
        cpuModel: os.cpus()[0]?.model || "Unknown",
        cpuCores: os.cpus().length,
      };
    }
  }
}
