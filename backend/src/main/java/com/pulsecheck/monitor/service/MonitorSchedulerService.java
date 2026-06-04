package com.pulsecheck.monitor.service;

import com.pulsecheck.monitor.entity.Monitor;
import com.pulsecheck.monitor.job.MonitorCheckJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorSchedulerService {

    private final Scheduler scheduler;

    public void scheduleMonitor(Monitor monitor) {
        try {
            JobKey jobKey = toJobKey(monitor.getId());
            TriggerKey triggerKey = toTriggerKey(monitor.getId());

            JobDetail jobDetail = JobBuilder.newJob(MonitorCheckJob.class)
                    .withIdentity(jobKey)
                    .usingJobData("monitorId", monitor.getId().toString())
                    .storeDurably()
                    .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity(triggerKey)
                    .forJob(jobDetail)
                    .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                            .withIntervalInSeconds(monitor.getCheckIntervalSeconds() != null
                                    ? monitor.getCheckIntervalSeconds() : 60)
                            .repeatForever())
                    .startNow()
                    .build();

            if (scheduler.checkExists(jobKey)) {
                scheduler.addJob(jobDetail, true);
                scheduler.rescheduleJob(triggerKey, trigger);
                log.info("[Scheduler] Rescheduled monitor '{}' (interval={}s)",
                        monitor.getName(), monitor.getCheckIntervalSeconds());
            } else {
                scheduler.scheduleJob(jobDetail, trigger);
                log.info("[Scheduler] Scheduled monitor '{}' (interval={}s)",
                        monitor.getName(), monitor.getCheckIntervalSeconds());
            }
        } catch (SchedulerException e) {
            log.error("[Scheduler] Failed to schedule monitor {}: {}", monitor.getId(), e.getMessage());
            throw new RuntimeException("Failed to schedule monitor", e);
        }
    }

    public void unscheduleMonitor(UUID monitorId) {
        try {
            boolean deleted = scheduler.deleteJob(toJobKey(monitorId));
            if (deleted) {
                log.info("[Scheduler] Unscheduled monitor {}", monitorId);
            }
        } catch (SchedulerException e) {
            log.error("[Scheduler] Failed to unschedule monitor {}: {}", monitorId, e.getMessage());
        }
    }

    private JobKey toJobKey(UUID monitorId) {
        return JobKey.jobKey("monitor-" + monitorId, "monitors");
    }

    private TriggerKey toTriggerKey(UUID monitorId) {
        return TriggerKey.triggerKey("trigger-" + monitorId, "monitors");
    }
}