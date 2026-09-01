self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch{data={body:event.data?.text?.()||'You have a new Funda Online Academy reminder.'}}
  const title=data.title||'Funda Online Academy';
  const options={
    body:data.body||'You have a new Academy reminder.',
    icon:'/logo.png',
    badge:'/logo.png',
    tag:data.tag||'funda-calendar-reminder',
    renotify:true,
    data:{url:data.url||'/dashboard.html',notificationId:data.notificationId||null},
    actions:[{action:'open',title:'Open Funda'}]
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'/dashboard.html',self.location.origin).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){
      if(client.url.startsWith(self.location.origin)){
        client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow(target);
  }));
});
