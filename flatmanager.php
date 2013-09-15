<?php

class FlatManager
{
	/**
	 * Path to browse.
	 *
	 * @var string
	 */
	private $givenPath;

	/**
	 * Absolute path used for internal purposes.
	 *
	 * @var string
	 */
	private $absPath;

	/**
	 * Public URL. This URL should be
	 * accessible over HTTP protocol.
	 *
	 * @var string
	 */
	private $publicBaseUrl = 'http://localhost:8888/flatmanager/';

	/**
	 * Read given path.
	 */
	public function readPath($path)
	{
		$this->givenPath = str_replace('//', '/', $path);
		$this->absPath = str_replace('//', '/', getcwd().'/'.$this->givenPath);

		if (is_file($this->absPath)) {
			// Load file info
			$data = array(
				'isFile' => true,
				'path' => $this->givenPath,
				'info' => $this->getFileInfo(),
			);
		} else {
			// Read directory content
			$data = array(
				'isFile' => false,
				'content' => $this->getDirContent(),
			);
		}

		return $data;
	}

	/**
	 * Store uploaded file.
	 *
	 * @var $uploadedFile string
	 * @var $uploadPath string
	 * @return boolean
	 */
	public function uploadFile($uploadedFile, $uploadPath)
	{
		$targetFilename = str_replace('//', '/', getcwd().'/'.$uploadPath.'/'.$uploadedFile['name']);
		$itt = 0;
		while(file_exists($targetFilename)) {
			$itt++;
			print_r($uploadedFile);
			$name = explode('.', $uploadedFile['name']);
			$name[0] = "{$name[0]}-{$itt}";
			$targetFilename = str_replace('//', '/', getcwd().'/'.$uploadPath.'/'.implode('.', $name));
			print_r($targetFilename);
		}

		return move_uploaded_file($uploadedFile['tmp_name'], $targetFilename);
	}

	private function getFileInfo()
	{
		$stat = stat($this->absPath);

		$pathInfo = pathinfo($this->absPath);

		$return = array(
			'atime' => $stat['atime'],
			'mtime' => $stat['mtime'],
			'ctime' => $stat['ctime'],
			'size' => $stat['size'],
			'mime' => mime_content_type($this->absPath),
			'publicUrl' => $this->getPublicUrl($this->givenPath),
		);

		return array_merge($return, $pathInfo);
	}

	/**
	 * Read content of directory.
	 *
	 * @return array
	 */
	private function getDirContent()
	{
		$content = array();

		if ($handle = opendir($this->absPath)) {
		    while (false !== ($item = readdir($handle))) {
		        if ($item != "." && $item != "..") {
		        	array_push($content,  array(
		        		'name' => $item,
		        		'path' => str_replace('//', '/', $this->givenPath.'/'.$item),
		        		'publicUrl' => is_file($this->absPath.'/'.$item) ? $this->getPublicUrl($item) : false,
	        		));
		        }
		    }
		    closedir($handle);
		}

		return $content;
	}

	/**
	 * Compose public URL for given path.
	 *
	 * @return string
	 */
	private function getPublicUrl($path)
	{
		return $this->publicBaseUrl.ltrim($path, '/');
	}


}

$fm = new FlatManager;

if (strtolower($_SERVER['REQUEST_METHOD']) === 'get') {
	$data = $fm->readPath(isset($_GET['path']) ? $_GET['path'] : '/');
	echo json_encode($data);
} else {
	foreach($_FILES as $file) {
		$data = $fm->uploadFile($file, $_POST['uploadPath']);
		echo json_encode($data);
	}
}
