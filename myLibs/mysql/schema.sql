drop table if exists user;
create table user(
    id smallint unsigned auto_increment not null primary key,
    fullname varchar(100) not null,
    email varchar(100) not null unique,
    pass varchar(60) not null,
    slug varchar(15) unique default null,
    standing enum('active','pending','disabled') default 'pending',
    born timestamp default now()
);

drop table if exists session;
create table session(
    user smallint unsigned not null,
    dataString varchar(200) not null,
    ip varchar(100) not null, 
    device varchar(100) not null,
    called timestamp default now() on update now(),
    born timestamp default now(),
    foreign key(user) references user(id)
);
