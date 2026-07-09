package com.trustintern.service;

import com.trustintern.model.Notification;
import com.trustintern.model.User;
import com.trustintern.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public Notification createNotification(User user, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .readStatus(false)
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Integer userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(Integer notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setReadStatus(true);
            notificationRepository.save(notification);
        });
    }
}
