create database oce;
use oce;

create table sessions 
( sessionid int unsigned not null auto_increment primary key,
  title char(100) not null,
  name char(40) not null,
  instructor1 char(50),
  instructor2 char(50)
);

create table sessevals
( evalid int unsigned not null auto_increment primary key,
  sessionid int unsigned not null,
  answers char(40)
);

create table confevals
( evalid int unsigned not null auto_increment primary key,
  answers char(100)
);
