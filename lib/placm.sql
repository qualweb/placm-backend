# drop database placmproto;
# create schema placmproto default character set utf8mb4;
# grant all privileges on placmproto.* to 'bandrade'@'localhost';
# flush privileges;
# use placmproto;
# 
CREATE TABLE `Rule` (
  `RuleId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Url` text NOT NULL,
  `Description` varchar(255) NOT NULL,
  PRIMARY KEY (`RuleId`)
# UNIQUE KEY `Url_idx` (`Url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `EvaluationTool` (
  `EvaluationToolId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Url` text DEFAULT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `Version` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`EvaluationToolId`),
  UNIQUE KEY `Name_UNIQUE` (`Name`)
# UNIQUE KEY `Url_UNIQUE` (`Url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AutomaticEvaluation` (
  `AutoEvalId` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(255),
  `Date` datetime,
  `Url` text,
  `PagesNumber` int,
  `Summary` varchar(255),
  `EvaluationToolId` int NOT NULL,
  `Deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`AutoEvalId`),
  KEY `EvaluationToolId_fk_idx` (`EvaluationToolId`),
  CONSTRAINT `EvaluationTool_AE_fk` FOREIGN KEY (`EvaluationToolId`) REFERENCES `EvaluationTool` (`EvaluationToolId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ManualEvaluation` (
  `ManualEvalId` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(255),
  `Date` datetime,
  `Url` text,
  `PagesNumber` int,
  `SatisfiedHeuristics` int,
  `ApplicableHeuristics` int,
  `Deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`ManualEvalId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `UsabilityTest` (
  `UsabTestId` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(255),
  `Date` datetime,
  `Url` text,
  `PagesNumber` int,
# participants em string ou int ???? # 
  `Participants` varchar(255),
  `Tanks` varchar(255),
  `Summary` varchar(255),
  `Deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`UsabTestId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Tag` (
  `TagId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`TagId`),
  UNIQUE KEY `Name_UNIQUE` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Contact` (
  `ContactId` int NOT NULL AUTO_INCREMENT,
  `Type` varchar(255),
  `Contact` varchar(255),
  `DurationResponse` varchar(255),
  PRIMARY KEY (`ContactId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Continent` (
  `ContinentId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY (`ContinentId`),
  UNIQUE KEY `Name_UNIQUE` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Country` (
  `CountryId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `ContinentId` int NOT NULL,
  PRIMARY KEY (`CountryId`),
  UNIQUE KEY `Name_UNIQUE` (`Name`),
  KEY `ContinentId_fk_idx` (`ContinentId`),
  CONSTRAINT `ContinentId` FOREIGN KEY (`ContinentId`) REFERENCES `Continent` (`ContinentId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Organization` (
  `OrganizationId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `ShortName` varchar(255),
  PRIMARY KEY (`OrganizationId`),
  UNIQUE KEY `Name_UNIQUE` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Application` (
  `ApplicationId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
# `ShortName` varchar(255),
  `OrganizationId` int NOT NULL,
# 0 website, 1 app
  `Type` tinyint NOT NULL DEFAULT '0',
# 0 public, 1 private
  `Sector` tinyint,
  `Url` text,
  `CreationDate` datetime NOT NULL,
  `CountryId` int,
  `Deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`ApplicationId`),
# UNIQUE KEY `Url_UNIQUE` (`Url`),
  KEY `CountryId_fk_idx` (`CountryId`),
  CONSTRAINT `OrganizationId_fk` FOREIGN KEY (`OrganizationId`) REFERENCES `Organization` (`OrganizationId`) ON DELETE CASCADE,
  CONSTRAINT `CountryId_fk` FOREIGN KEY (`CountryId`) REFERENCES `Country` (`CountryId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Page` (
  `PageId` int NOT NULL AUTO_INCREMENT,
  `Url` text NOT NULL,
  `CreationDate` datetime NOT NULL,
  `ApplicationId` int NOT NULL,
  `Deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`PageId`),
# UNIQUE KEY `Url_UNIQUE` (`Url`),
  KEY `ApplicationId_fk_idx` (`ApplicationId`),
  CONSTRAINT `ApplicationId_fk` FOREIGN KEY (`ApplicationId`) REFERENCES `Application` (`ApplicationId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Assertion` (
  `AssertionId` int NOT NULL AUTO_INCREMENT,
  `EvaluationToolId` int NOT NULL,
  `RuleId` int NOT NULL,
  `PageId` int NOT NULL,
  `Mode` enum('automatic','manual', 'semiAuto','undisclosed','unknownMode') NOT NULL,
  `Date` datetime NOT NULL,
  `Description` varchar(255),
  `Outcome` enum('passed','failed','cantTell','inapplicable','untested') NOT NULL,
# `TestedUrl` varchar(255) NOT NULL,
  `Deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`AssertionId`),
# KEY `TestedUrl_idx` (`TestedUrl`),
  KEY `EvaluationToolId_fk_idx` (`EvaluationToolId`),
  KEY `RuleId_fk_idx` (`RuleId`),
  KEY `PageId_fk_idx` (`PageId`),
  CONSTRAINT `EvaluationToolId_fk` FOREIGN KEY (`EvaluationToolId`) REFERENCES `EvaluationTool` (`EvaluationToolId`) ON DELETE CASCADE,
  CONSTRAINT `RuleId_fk` FOREIGN KEY (`RuleId`) REFERENCES `Rule` (`RuleId`) ON DELETE CASCADE,
  CONSTRAINT `PageId_fk` FOREIGN KEY (`PageId`) REFERENCES `Page` (`PageId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AccessibilityStatement` (
  `ASId` int NOT NULL AUTO_INCREMENT,
  `Origin` varchar(255) NOT NULL,
  `ApplicationId` int NOT NULL,
# `Name` varchar(255) NOT NULL,
  `Standard` enum('2.0','2.1','other','unknown') NOT NULL,
  `Date` datetime NOT NULL,
# 0 not assessed, 1 non conformant, 2 partially conformant, 3 fully conformant
  `State` enum('0','1','2','3') NOT NULL,
  `ASUrl` text,
# 0 none, 1 bronze, 2 prata, 3 ouro
  `UsabilityStamp` enum('0','1','2','3'),
  `UsabilityStampText` varchar(255),
  `EffortsCounter` int,
  `LimitationsWithAltCounter` int,
  `LimitationsWithoutAltCounter` int,
  `CompatabilitiesCounter` int,
  `IncompatabilitiesCounter` int,
  `TechnologiesUsed` varchar(255),
# 0 other, 1 internal, 2 external
  `AccessmentApproach` varchar(3) NOT NULL DEFAULT '000',
  `Deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`ASId`),
# UNIQUE KEY `ASUrl_UNIQUE` (`ASUrl`),
  CONSTRAINT `Application_AS_fk` FOREIGN KEY (`ApplicationId`) REFERENCES `Application` (`ApplicationId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

 CREATE TABLE `ScorePage` (
  `PageId` int NOT NULL,
  `Score` decimal(4,1) NOT NULL,
  `Date` datetime NOT NULL,
  PRIMARY KEY (`PageId`),
  CONSTRAINT `PageId_Score_fk` FOREIGN KEY (`PageId`) REFERENCES `Page` (`PageId`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AcceStatUsabTest` (
  `ASId` int NOT NULL,
  `UsabTestId` int NOT NULL,
  PRIMARY KEY (`ASId`,`UsabTestId`),
  CONSTRAINT `AS_UT_fk` FOREIGN KEY (`ASId`) REFERENCES `AccessibilityStatement` (`ASId`) ON DELETE CASCADE,
  CONSTRAINT `UsabTest_AS_fk` FOREIGN KEY (`UsabTestId`) REFERENCES `UsabilityTest` (`UsabTestId`) ON DELETE CASCADE
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AcceStatManualEval` (
  `ASId` int NOT NULL,
  `ManualEvalId` int NOT NULL,
  PRIMARY KEY (`ASId`,`ManualEvalId`),
  CONSTRAINT `AS_ME_fk` FOREIGN KEY (`ASId`) REFERENCES `AccessibilityStatement` (`ASId`) ON DELETE CASCADE,
  CONSTRAINT `ManualEval_AS_fk` FOREIGN KEY (`ManualEvalId`) REFERENCES `ManualEvaluation` (`ManualEvalId`) ON DELETE CASCADE
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AcceStatAutoEval` (
  `ASId` int NOT NULL,
  `AutoEvalId` int NOT NULL,
  PRIMARY KEY (`ASId`,`AutoEvalId`),
  CONSTRAINT `AS_AE_fk` FOREIGN KEY (`ASId`) REFERENCES `AccessibilityStatement` (`ASId`) ON DELETE CASCADE,
  CONSTRAINT `AutoEval_AS_fk` FOREIGN KEY (`AutoEvalId`) REFERENCES `AutomaticEvaluation` (`AutoEvalId`) ON DELETE CASCADE
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AcceStatContact` (
  `ASId` int NOT NULL,
  `ContactId` int NOT NULL,
  PRIMARY KEY (`ASId`,`ContactId`),
  CONSTRAINT `ContactId_AS_fk` FOREIGN KEY (`ContactId`) REFERENCES `Contact` (`ContactId`) ON DELETE CASCADE,
  CONSTRAINT `AS_Contact_fk` FOREIGN KEY (`ASId`) REFERENCES `AccessibilityStatement` (`ASId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `AssertionAutoEval` (
  `AssertionId` int NOT NULL,
  `AutoEvalId` int NOT NULL,
  PRIMARY KEY (`AssertionId`,`AutoEvalId`),
  CONSTRAINT `Assertion_AE_fk` FOREIGN KEY (`AssertionId`) REFERENCES `Assertion` (`AssertionId`) ON DELETE CASCADE,
  CONSTRAINT `AutoEval_Assert_fk` FOREIGN KEY (`AutoEvalId`) REFERENCES `AutomaticEvaluation` (`AutoEvalId`) ON DELETE CASCADE
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `TagApplication` (
  `TagId` int NOT NULL,
  `ApplicationId` int NOT NULL,
  PRIMARY KEY (`TagId`,`ApplicationId`),
  CONSTRAINT `Tag_App_fk` FOREIGN KEY (`TagId`) REFERENCES `Tag` (`TagId`) ON DELETE CASCADE,
  CONSTRAINT `Application_Tag_fk` FOREIGN KEY (`ApplicationId`) REFERENCES `Application` (`ApplicationId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO Continent (name) VALUES ('Asia');
INSERT INTO Country (name, continentId) VALUES ('Afghanistan', 1);
INSERT INTO Continent (name) VALUES ('Europe');
INSERT INTO Country (name, continentId) VALUES ('Albania', 2);
INSERT INTO Continent (name) VALUES ('Africa');
INSERT INTO Country (name, continentId) VALUES ('Algeria', 3);
INSERT INTO Continent (name) VALUES ('Oceania');
INSERT INTO Country (name, continentId) VALUES ('American Samoa', 4);
INSERT INTO Country (name, continentId) VALUES ('Andorra', 2);
INSERT INTO Country (name, continentId) VALUES ('Angola', 3);
INSERT INTO Continent (name) VALUES ('North America');
INSERT INTO Country (name, continentId) VALUES ('Anguilla', 5);
INSERT INTO Continent (name) VALUES ('Antarctica');
INSERT INTO Country (name, continentId) VALUES ('Antarctica', 6);
INSERT INTO Country (name, continentId) VALUES ('Antigua and Barbuda', 5);
INSERT INTO Continent (name) VALUES ('South America');
INSERT INTO Country (name, continentId) VALUES ('Argentina', 7);
INSERT INTO Country (name, continentId) VALUES ('Armenia', 1);
INSERT INTO Country (name, continentId) VALUES ('Aruba', 5);
INSERT INTO Country (name, continentId) VALUES ('Australia', 4);
INSERT INTO Country (name, continentId) VALUES ('Austria', 2);
INSERT INTO Country (name, continentId) VALUES ('Azerbaijan', 1);
INSERT INTO Country (name, continentId) VALUES ('Bahamas', 5);
INSERT INTO Country (name, continentId) VALUES ('Bahrain', 1);
INSERT INTO Country (name, continentId) VALUES ('Bangladesh', 1);
INSERT INTO Country (name, continentId) VALUES ('Barbados', 5);
INSERT INTO Country (name, continentId) VALUES ('Belarus', 2);
INSERT INTO Country (name, continentId) VALUES ('Belgium', 2);
INSERT INTO Country (name, continentId) VALUES ('Belize', 5);
INSERT INTO Country (name, continentId) VALUES ('Benin', 3);
INSERT INTO Country (name, continentId) VALUES ('Bermuda', 5);
INSERT INTO Country (name, continentId) VALUES ('Bhutan', 1);
INSERT INTO Country (name, continentId) VALUES ('Bolivia', 7);
INSERT INTO Country (name, continentId) VALUES ('Bosnia and Herzegovina', 2);
INSERT INTO Country (name, continentId) VALUES ('Botswana', 3);
INSERT INTO Country (name, continentId) VALUES ('Bouvet Island', 6);
INSERT INTO Country (name, continentId) VALUES ('Brazil', 7);
INSERT INTO Country (name, continentId) VALUES ('British Indian Ocean Territory', 3);
INSERT INTO Country (name, continentId) VALUES ('Brunei', 1);
INSERT INTO Country (name, continentId) VALUES ('Bulgaria', 2);
INSERT INTO Country (name, continentId) VALUES ('Burkina Faso', 3);
INSERT INTO Country (name, continentId) VALUES ('Burundi', 3);
INSERT INTO Country (name, continentId) VALUES ('Cambodia', 1);
INSERT INTO Country (name, continentId) VALUES ('Cameroon', 3);
INSERT INTO Country (name, continentId) VALUES ('Canada', 5);
INSERT INTO Country (name, continentId) VALUES ('Cape Verde', 3);
INSERT INTO Country (name, continentId) VALUES ('Cayman Islands', 5);
INSERT INTO Country (name, continentId) VALUES ('Central African Republic', 3);
INSERT INTO Country (name, continentId) VALUES ('Chad', 3);
INSERT INTO Country (name, continentId) VALUES ('Chile', 7);
INSERT INTO Country (name, continentId) VALUES ('China', 1);
INSERT INTO Country (name, continentId) VALUES ('Christmas Island', 4);
INSERT INTO Country (name, continentId) VALUES ('Cocos (Keeling) Islands', 4);
INSERT INTO Country (name, continentId) VALUES ('Colombia', 7);
INSERT INTO Country (name, continentId) VALUES ('Comoros', 3);
INSERT INTO Country (name, continentId) VALUES ('Congo', 3);
INSERT INTO Country (name, continentId) VALUES ('Cook Islands', 4);
INSERT INTO Country (name, continentId) VALUES ('Costa Rica', 5);
INSERT INTO Country (name, continentId) VALUES ('Croatia', 2);
INSERT INTO Country (name, continentId) VALUES ('Cuba', 5);
INSERT INTO Country (name, continentId) VALUES ('Cyprus', 1);
INSERT INTO Country (name, continentId) VALUES ('Czech Republic', 2);
INSERT INTO Country (name, continentId) VALUES ('Denmark', 2);
INSERT INTO Country (name, continentId) VALUES ('Djibouti', 3);
INSERT INTO Country (name, continentId) VALUES ('Dominica', 5);
INSERT INTO Country (name, continentId) VALUES ('Dominican Republic', 5);
INSERT INTO Country (name, continentId) VALUES ('East Timor', 1);
INSERT INTO Country (name, continentId) VALUES ('Ecuador', 7);
INSERT INTO Country (name, continentId) VALUES ('Egypt', 3);
INSERT INTO Country (name, continentId) VALUES ('El Salvador', 5);
INSERT INTO Country (name, continentId) VALUES ('England', 2);
INSERT INTO Country (name, continentId) VALUES ('Equatorial Guinea', 3);
INSERT INTO Country (name, continentId) VALUES ('Eritrea', 3);
INSERT INTO Country (name, continentId) VALUES ('Estonia', 2);
INSERT INTO Country (name, continentId) VALUES ('Ethiopia', 3);
INSERT INTO Country (name, continentId) VALUES ('Falkland Islands', 7);
INSERT INTO Country (name, continentId) VALUES ('Faroe Islands', 2);
INSERT INTO Country (name, continentId) VALUES ('Fiji Islands', 4);
INSERT INTO Country (name, continentId) VALUES ('Finland', 2);
INSERT INTO Country (name, continentId) VALUES ('France', 2);
INSERT INTO Country (name, continentId) VALUES ('French Guiana', 7);
INSERT INTO Country (name, continentId) VALUES ('French Polynesia', 4);
INSERT INTO Country (name, continentId) VALUES ('French Southern territories', 6);
INSERT INTO Country (name, continentId) VALUES ('Gabon', 3);
INSERT INTO Country (name, continentId) VALUES ('Gambia', 3);
INSERT INTO Country (name, continentId) VALUES ('Georgia', 1);
INSERT INTO Country (name, continentId) VALUES ('Germany', 2);
INSERT INTO Country (name, continentId) VALUES ('Ghana', 3);
INSERT INTO Country (name, continentId) VALUES ('Gibraltar', 2);
INSERT INTO Country (name, continentId) VALUES ('Greece', 2);
INSERT INTO Country (name, continentId) VALUES ('Greenland', 5);
INSERT INTO Country (name, continentId) VALUES ('Grenada', 5);
INSERT INTO Country (name, continentId) VALUES ('Guadeloupe', 5);
INSERT INTO Country (name, continentId) VALUES ('Guam', 4);
INSERT INTO Country (name, continentId) VALUES ('Guatemala', 5);
INSERT INTO Country (name, continentId) VALUES ('Guinea', 3);
INSERT INTO Country (name, continentId) VALUES ('Guinea-Bissau', 3);
INSERT INTO Country (name, continentId) VALUES ('Guyana', 7);
INSERT INTO Country (name, continentId) VALUES ('Haiti', 5);
INSERT INTO Country (name, continentId) VALUES ('Heard Island and McDonald Islands', 6);
INSERT INTO Country (name, continentId) VALUES ('Holy See (Vatican City State)', 2);
INSERT INTO Country (name, continentId) VALUES ('Honduras', 5);
INSERT INTO Country (name, continentId) VALUES ('Hong Kong', 1);
INSERT INTO Country (name, continentId) VALUES ('Hungary', 2);
INSERT INTO Country (name, continentId) VALUES ('Iceland', 2);
INSERT INTO Country (name, continentId) VALUES ('India', 1);
INSERT INTO Country (name, continentId) VALUES ('Indonesia', 1);
INSERT INTO Country (name, continentId) VALUES ('Iran', 1);
INSERT INTO Country (name, continentId) VALUES ('Iraq', 1);
INSERT INTO Country (name, continentId) VALUES ('Ireland', 2);
INSERT INTO Country (name, continentId) VALUES ('Israel', 1);
INSERT INTO Country (name, continentId) VALUES ('Italy', 2);
INSERT INTO Country (name, continentId) VALUES ('Ivory Coast', 3);
INSERT INTO Country (name, continentId) VALUES ('Jamaica', 5);
INSERT INTO Country (name, continentId) VALUES ('Japan', 1);
INSERT INTO Country (name, continentId) VALUES ('Jordan', 1);
INSERT INTO Country (name, continentId) VALUES ('Kazakhstan', 1);
INSERT INTO Country (name, continentId) VALUES ('Kenya', 3);
INSERT INTO Country (name, continentId) VALUES ('Kiribati', 4);
INSERT INTO Country (name, continentId) VALUES ('Kuwait', 1);
INSERT INTO Country (name, continentId) VALUES ('Kyrgyzstan', 1);
INSERT INTO Country (name, continentId) VALUES ('Laos', 1);
INSERT INTO Country (name, continentId) VALUES ('Latvia', 2);
INSERT INTO Country (name, continentId) VALUES ('Lebanon', 1);
INSERT INTO Country (name, continentId) VALUES ('Lesotho', 3);
INSERT INTO Country (name, continentId) VALUES ('Liberia', 3);
INSERT INTO Country (name, continentId) VALUES ('Libyan Arab Jamahiriya', 3);
INSERT INTO Country (name, continentId) VALUES ('Liechtenstein', 2);
INSERT INTO Country (name, continentId) VALUES ('Lithuania', 2);
INSERT INTO Country (name, continentId) VALUES ('Luxembourg', 2);
INSERT INTO Country (name, continentId) VALUES ('Macao', 1);
INSERT INTO Country (name, continentId) VALUES ('North Macedonia', 2);
INSERT INTO Country (name, continentId) VALUES ('Madagascar', 3);
INSERT INTO Country (name, continentId) VALUES ('Malawi', 3);
INSERT INTO Country (name, continentId) VALUES ('Malaysia', 1);
INSERT INTO Country (name, continentId) VALUES ('Maldives', 1);
INSERT INTO Country (name, continentId) VALUES ('Mali', 3);
INSERT INTO Country (name, continentId) VALUES ('Malta', 2);
INSERT INTO Country (name, continentId) VALUES ('Marshall Islands', 4);
INSERT INTO Country (name, continentId) VALUES ('Martinique', 5);
INSERT INTO Country (name, continentId) VALUES ('Mauritania', 3);
INSERT INTO Country (name, continentId) VALUES ('Mauritius', 3);
INSERT INTO Country (name, continentId) VALUES ('Mayotte', 3);
INSERT INTO Country (name, continentId) VALUES ('Mexico', 5);
INSERT INTO Country (name, continentId) VALUES ('Micronesia, Federated States of', 4);
INSERT INTO Country (name, continentId) VALUES ('Moldova', 2);
INSERT INTO Country (name, continentId) VALUES ('Monaco', 2);
INSERT INTO Country (name, continentId) VALUES ('Mongolia', 1);
INSERT INTO Country (name, continentId) VALUES ('Montserrat', 5);
INSERT INTO Country (name, continentId) VALUES ('Morocco', 3);
INSERT INTO Country (name, continentId) VALUES ('Mozambique', 3);
INSERT INTO Country (name, continentId) VALUES ('Myanmar', 1);
INSERT INTO Country (name, continentId) VALUES ('Namibia', 3);
INSERT INTO Country (name, continentId) VALUES ('Nauru', 4);
INSERT INTO Country (name, continentId) VALUES ('Nepal', 1);
INSERT INTO Country (name, continentId) VALUES ('Netherlands', 2);
INSERT INTO Country (name, continentId) VALUES ('Netherlands Antilles', 5);
INSERT INTO Country (name, continentId) VALUES ('New Caledonia', 4);
INSERT INTO Country (name, continentId) VALUES ('New Zealand', 4);
INSERT INTO Country (name, continentId) VALUES ('Nicaragua', 5);
INSERT INTO Country (name, continentId) VALUES ('Niger', 3);
INSERT INTO Country (name, continentId) VALUES ('Nigeria', 3);
INSERT INTO Country (name, continentId) VALUES ('Niue', 4);
INSERT INTO Country (name, continentId) VALUES ('Norfolk Island', 4);
INSERT INTO Country (name, continentId) VALUES ('North Korea', 1);
INSERT INTO Country (name, continentId) VALUES ('Northern Ireland', 2);
INSERT INTO Country (name, continentId) VALUES ('Northern Mariana Islands', 4);
INSERT INTO Country (name, continentId) VALUES ('Norway', 2);
INSERT INTO Country (name, continentId) VALUES ('Oman', 1);
INSERT INTO Country (name, continentId) VALUES ('Pakistan', 1);
INSERT INTO Country (name, continentId) VALUES ('Palau', 4);
INSERT INTO Country (name, continentId) VALUES ('Palestine', 1);
INSERT INTO Country (name, continentId) VALUES ('Panama', 5);
INSERT INTO Country (name, continentId) VALUES ('Papua New Guinea', 4);
INSERT INTO Country (name, continentId) VALUES ('Paraguay', 7);
INSERT INTO Country (name, continentId) VALUES ('Peru', 7);
INSERT INTO Country (name, continentId) VALUES ('Philippines', 1);
INSERT INTO Country (name, continentId) VALUES ('Pitcairn', 4);
INSERT INTO Country (name, continentId) VALUES ('Poland', 2);
INSERT INTO Country (name, continentId) VALUES ('Portugal', 2);
INSERT INTO Country (name, continentId) VALUES ('Puerto Rico', 5);
INSERT INTO Country (name, continentId) VALUES ('Qatar', 1);
INSERT INTO Country (name, continentId) VALUES ('Reunion', 3);
INSERT INTO Country (name, continentId) VALUES ('Romania', 2);
INSERT INTO Country (name, continentId) VALUES ('Russian Federation', 2);
INSERT INTO Country (name, continentId) VALUES ('Rwanda', 3);
INSERT INTO Country (name, continentId) VALUES ('Saint Helena', 3);
INSERT INTO Country (name, continentId) VALUES ('Saint Kitts and Nevis', 5);
INSERT INTO Country (name, continentId) VALUES ('Saint Lucia', 5);
INSERT INTO Country (name, continentId) VALUES ('Saint Pierre and Miquelon', 5);
INSERT INTO Country (name, continentId) VALUES ('Saint Vincent and the Grenadines', 5);
INSERT INTO Country (name, continentId) VALUES ('Samoa', 4);
INSERT INTO Country (name, continentId) VALUES ('San Marino', 2);
INSERT INTO Country (name, continentId) VALUES ('Sao Tome and Principe', 3);
INSERT INTO Country (name, continentId) VALUES ('Saudi Arabia', 1);
INSERT INTO Country (name, continentId) VALUES ('Scotland', 2);
INSERT INTO Country (name, continentId) VALUES ('Senegal', 3);
INSERT INTO Country (name, continentId) VALUES ('Seychelles', 3);
INSERT INTO Country (name, continentId) VALUES ('Sierra Leone', 3);
INSERT INTO Country (name, continentId) VALUES ('Singapore', 1);
INSERT INTO Country (name, continentId) VALUES ('Slovakia', 2);
INSERT INTO Country (name, continentId) VALUES ('Slovenia', 2);
INSERT INTO Country (name, continentId) VALUES ('Solomon Islands', 4);
INSERT INTO Country (name, continentId) VALUES ('Somalia', 3);
INSERT INTO Country (name, continentId) VALUES ('South Africa', 3);
INSERT INTO Country (name, continentId) VALUES ('South Georgia and the South Sandwich Islands', 6);
INSERT INTO Country (name, continentId) VALUES ('South Korea', 1);
INSERT INTO Country (name, continentId) VALUES ('South Sudan', 3);
INSERT INTO Country (name, continentId) VALUES ('Spain', 2);
INSERT INTO Country (name, continentId) VALUES ('Sri Lanka', 1);
INSERT INTO Country (name, continentId) VALUES ('Sudan', 3);
INSERT INTO Country (name, continentId) VALUES ('Suriname', 7);
INSERT INTO Country (name, continentId) VALUES ('Svalbard and Jan Mayen', 2);
INSERT INTO Country (name, continentId) VALUES ('Swaziland', 3);
INSERT INTO Country (name, continentId) VALUES ('Sweden', 2);
INSERT INTO Country (name, continentId) VALUES ('Switzerland', 2);
INSERT INTO Country (name, continentId) VALUES ('Syria', 1);
INSERT INTO Country (name, continentId) VALUES ('Tajikistan', 1);
INSERT INTO Country (name, continentId) VALUES ('Tanzania', 3);
INSERT INTO Country (name, continentId) VALUES ('Thailand', 1);
INSERT INTO Country (name, continentId) VALUES ('The Democratic Republic of Congo', 3);
INSERT INTO Country (name, continentId) VALUES ('Togo', 3);
INSERT INTO Country (name, continentId) VALUES ('Tokelau', 4);
INSERT INTO Country (name, continentId) VALUES ('Tonga', 4);
INSERT INTO Country (name, continentId) VALUES ('Trinidad and Tobago', 5);
INSERT INTO Country (name, continentId) VALUES ('Tunisia', 3);
INSERT INTO Country (name, continentId) VALUES ('Turkey', 1);
INSERT INTO Country (name, continentId) VALUES ('Turkmenistan', 1);
INSERT INTO Country (name, continentId) VALUES ('Turks and Caicos Islands', 5);
INSERT INTO Country (name, continentId) VALUES ('Tuvalu', 4);
INSERT INTO Country (name, continentId) VALUES ('Uganda', 3);
INSERT INTO Country (name, continentId) VALUES ('Ukraine', 2);
INSERT INTO Country (name, continentId) VALUES ('United Arab Emirates', 1);
INSERT INTO Country (name, continentId) VALUES ('United Kingdom', 2);
INSERT INTO Country (name, continentId) VALUES ('United States', 5);
INSERT INTO Country (name, continentId) VALUES ('United States Minor Outlying Islands', 4);
INSERT INTO Country (name, continentId) VALUES ('Uruguay', 7);
INSERT INTO Country (name, continentId) VALUES ('Uzbekistan', 1);
INSERT INTO Country (name, continentId) VALUES ('Vanuatu', 4);
INSERT INTO Country (name, continentId) VALUES ('Venezuela', 7);
INSERT INTO Country (name, continentId) VALUES ('Vietnam', 1);
INSERT INTO Country (name, continentId) VALUES ('Virgin Islands, British', 5);
INSERT INTO Country (name, continentId) VALUES ('Virgin Islands, U.S.', 5);
INSERT INTO Country (name, continentId) VALUES ('Wales', 2);
INSERT INTO Country (name, continentId) VALUES ('Wallis and Futuna', 4);
INSERT INTO Country (name, continentId) VALUES ('Western Sahara', 3);
INSERT INTO Country (name, continentId) VALUES ('Yemen', 1);
INSERT INTO Country (name, continentId) VALUES ('Yugoslavia', 2);
INSERT INTO Country (name, continentId) VALUES ('Zambia', 3);
INSERT INTO Country (name, continentId) VALUES ('Zimbabwe', 3);