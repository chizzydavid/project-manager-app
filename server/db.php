<?php
  require_once('config.php');

  class DATABASE {
    public function __construct() {
      $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
      $this->conn = $mysqli;
      if(!$mysqli) echo 'Failed to connect '. $mysqli->error;
    }

    public function clean($string) {
      $trimstring = trim($string);
      $string = $this->conn->real_escape_string($trimstring);
      return $string; 
    }

    public function insert($table, $fields, $values) {
      $fields = implode(", ", $fields);
      $values = implode(", ", $values);

      $query = "INSERT INTO $table ($fields) VALUES($values)";
      $insert = $this->conn->query($query);
      if ($insert) return $insert;
      else 
        echo '<pre>' . $this->conn->error;
        return false;
    }

    public function update($query) {
      $result = $this->conn->query($query);
      if ($result) return $result;
      else return 'Error querying the database ' . $this->conn->error;    
    }

    public function select($query) {
      $result = $this->conn->query($query);
      if ($result) return $result;
      else return 'Error querying the database ' . $this->conn->error;
    }
  }

  $db = new DATABASE;

 

?>



