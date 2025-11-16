# MAJIN Machine Specification

**Last Updated**: 2025-11-17  
**Location**: AWS EC2 us-west-2  
**Purpose**: Miyabi AI Development Server

---

## Hardware Specifications

### Instance Type: r5.4xlarge

| Component | Specification |
|-----------|--------------|
| vCPU | 16 cores (Intel Xeon Platinum 8000) |
| RAM | 128 GB DDR4 ECC |
| Storage | 500 GB EBS gp3 (3000 IOPS) |
| Network | Up to 10 Gbps |
| Architecture | x86_64 |

---

## Network Configuration

- **IPv4**: 44.250.27.197
- **DNS**: ec2-44-250-27-197.us-west-2.compute.amazonaws.com
- **Region**: us-west-2 (Oregon)

---

## Software Environment

- **OS**: Ubuntu 22.04 LTS
- **Rust**: 1.82.0
- **Git**: 2.34.1
- **Node.js**: v18.19.0
- **Python**: 3.10.12

---

## Connection Methods

```bash
# From Pixel Termux
m       # SSH connection
c       # Claude Code
cc      # tmux + Claude Code

# From MacBook
ssh mugen
```

---

## Performance Characteristics

### 100 Sessions Test Results
- CPU: 72% utilization
- RAM: 89 GB used (70%)
- Network: 1.53 Gbps
- Disk I/O: 48.7% utilization

**Recommendation**: Safe operation up to 80 sessions

---

## Cost Analysis

- **Monthly Cost**: $736 (r5.4xlarge)
- **Per Session**: $7.36/month
- **Upgrade to r5.8xlarge**: $1,104/month (200 sessions)

---

**Document Status**: Complete
